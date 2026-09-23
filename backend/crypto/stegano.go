package crypto

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"io"
)

// EncodeWatermark embeds a hidden payload (e.g., Officer Badge ID) into an image using
// Least Significant Bit (LSB) Steganography. This is invisible to the human eye but
// survives screenshots and cropping.
func EncodeWatermark(imgData io.Reader, payload string, format string) ([]byte, error) {
	img, _, err := image.Decode(imgData)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	// Create a new editable RGBA image
	rgba := image.NewRGBA(bounds)
	draw.Draw(rgba, bounds, img, bounds.Min, draw.Src)

	// Convert payload to bytes and add a termination marker (0x00)
	payloadBytes := append([]byte(payload), 0x00)
	bitIndex := 0
	payloadLenBits := len(payloadBytes) * 8

	// Iterate over pixels to encode the bits
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			if bitIndex >= payloadLenBits {
				break
			}

			// Get original pixel color
			c := rgba.RGBAAt(x, y)
			
			// Get the current bit of the payload to encode
			byteIdx := bitIndex / 8
			bitInByte := uint(7 - (bitIndex % 8))
			bitVal := (payloadBytes[byteIdx] >> bitInByte) & 1

			// Clear the Least Significant Bit of the Blue channel and set it to our bit
			c.B = (c.B & 0xFE) | uint8(bitVal)
			
			// Set the modified pixel back
			rgba.SetRGBA(x, y, c)
			bitIndex++
		}
		if bitIndex >= payloadLenBits {
			break
		}
	}

	// Encode back to bytes
	var buf bytes.Buffer
	if format == "jpeg" || format == "jpg" {
		err = jpeg.Encode(&buf, rgba, &jpeg.Options{Quality: 100})
	} else {
		err = png.Encode(&buf, rgba)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to encode output image: %w", err)
	}

	return buf.Bytes(), nil
}

// DecodeWatermark extracts the hidden payload (Badge ID) from a watermarked image.
// Used by internal affairs to trace leaked screenshots.
func DecodeWatermark(imgData io.Reader) (string, error) {
	img, _, err := image.Decode(imgData)
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	var payloadBytes []byte
	var currentByte uint8
	bitIndex := 0

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			// Extract color
			var b uint32
			switch c := img.At(x, y).(type) {
			case color.RGBA:
				b = uint32(c.B)
			case color.NRGBA:
				b = uint32(c.B)
			case color.YCbCr:
				_, _, bC := color.YCbCrToRGB(c.Y, c.Cb, c.Cr)
				b = uint32(bC)
			default:
				_, _, b32, _ := img.At(x, y).RGBA()
				b = b32 >> 8
			}

			// Extract the LSB
			lsb := uint8(b & 1)
			
			// Shift into current byte
			currentByte = (currentByte << 1) | lsb
			bitIndex++

			// If we've completed a byte
			if bitIndex%8 == 0 {
				if currentByte == 0x00 {
					// Termination marker found
					return string(payloadBytes), nil
				}
				payloadBytes = append(payloadBytes, currentByte)
				currentByte = 0
			}
			
			// Safety cutoff to prevent infinite loops on unwatermarked images
			if len(payloadBytes) > 1024 {
				return "", fmt.Errorf("no watermark termination marker found")
			}
		}
	}

	return "", fmt.Errorf("watermark not found in image")
}
