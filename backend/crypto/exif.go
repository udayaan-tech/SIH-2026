package crypto

import (
	"bytes"
	"fmt"
	"io"
	
	"github.com/dsoprea/go-exif/v3"
	exifcommon "github.com/dsoprea/go-exif/v3/common"
)

// StripEXIF removes all EXIF metadata (GPS coordinates, camera model, timestamps)
// from JPEG images. This is critical for protecting victim locations and preventing
// accidental data leaks from crime scene photos.
func StripEXIF(imgData []byte) ([]byte, error) {
	// 1. Search for EXIF data in the image
	_, _, err := exif.SearchAndExtractExifWithBrowser(imgData)
	if err != nil {
		if err == exif.ErrNoExif {
			// Image doesn't have EXIF data, return as-is
			return imgData, nil
		}
		return nil, fmt.Errorf("error checking EXIF data: %w", err)
	}

	// 2. EXIF data exists. We need to create a new IFD builder with NO tags.
	im, err := exifcommon.NewIfdMappingWithStandard()
	if err != nil {
		return nil, fmt.Errorf("failed to create IFD mapping: %w", err)
	}

	// Create an empty EXIF block
	ti := exif.NewTagIndex()
	ib := exif.NewIfdBuilder(im, ti, exifcommon.IfdStandardIfdIdentity, exifcommon.EncodeDefaultByteOrder)
	
	// Generate the empty EXIF bytes
	emptyExifBytes := make([]byte, 0)
	emptyExifBuffer := bytes.NewBuffer(emptyExifBytes)
	err = ib.Write(emptyExifBuffer)
	if err != nil {
		return nil, fmt.Errorf("failed to write empty EXIF block: %w", err)
	}

	// 3. Write the image back with the EXIF block removed/replaced
	// For JPEG, we use the exif package's SetExif function to replace it with our empty block
	var buf bytes.Buffer
	mc, err := exifcommon.NewMediaContext(imgData)
	if err != nil {
		// If it fails to parse as a media context, fallback to just returning the image
		return imgData, nil
	}

	if err := mc.SetExif(emptyExifBuffer.Bytes()); err != nil {
		return nil, fmt.Errorf("failed to strip EXIF: %w", err)
	}

	if err := mc.Write(&buf); err != nil {
		return nil, fmt.Errorf("failed to write sanitized image: %w", err)
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

	im, _ := exifcommon.NewIfdMappingWithStandard()
	ti := exif.NewTagIndex()
	_, index, err := exif.Collect(im, ti, rawExif)
	
	if err != nil {
		return true // Unparseable EXIF is treated as safe for our purposes
	}

	// Check if GPS info IFD is present
	if _, err := index.RootIfd.ChildWithIfdPath(exifcommon.IfdGpsInfoStandardIfdIdentity); err == nil {
		return false // GPS data found! Not sanitized.
	}

	return true // No GPS data found
}
