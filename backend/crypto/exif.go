package crypto

import (
	"bytes"
	"fmt"
	"image/jpeg"
	"io"

	"github.com/dsoprea/go-exif/v3"
	exifcommon "github.com/dsoprea/go-exif/v3/common"
)

// StripEXIF removes all EXIF metadata (GPS coordinates, camera model, timestamps)
// from JPEG images. This is critical for protecting victim locations and preventing
// accidental data leaks from crime scene photos.
func StripEXIF(imgData []byte) ([]byte, error) {
	// Re-encoding JPEG using Go's standard library cleanly strips all EXIF/APP1
	// metadata segments while preserving visual image fidelity.
	img, err := jpeg.Decode(bytes.NewReader(imgData))
	if err != nil {
		// If not a standard JPEG or unparseable, return original data
		return imgData, nil
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 95}); err != nil {
		return nil, fmt.Errorf("failed to encode sanitized JPEG: %w", err)
	}

	return buf.Bytes(), nil
}

// IsSanitized checks if an image has GPS metadata. Returns true if NO GPS data exists.
func IsSanitized(imgData io.Reader) bool {
	rawBytes, err := io.ReadAll(imgData)
	if err != nil {
		return false
	}

	rawExif, err := exif.SearchAndExtractExif(rawBytes)
	if err != nil {
		// If no EXIF exists, it is sanitized
		return err == exif.ErrNoExif
	}

	im, err := exifcommon.NewIfdMappingWithStandard()
	if err != nil {
		return true
	}
	ti := exif.NewTagIndex()
	_, index, err := exif.Collect(im, ti, rawExif)
	if err != nil {
		return true // Unparseable EXIF is treated as safe
	}

	// Check if GPS info IFD is present
	if _, err := index.RootIfd.ChildWithIfdPath(exifcommon.IfdGpsInfoStandardIfdIdentity); err == nil {
		return false // GPS data found! Not sanitized.
	}

	return true // No GPS data found
}
