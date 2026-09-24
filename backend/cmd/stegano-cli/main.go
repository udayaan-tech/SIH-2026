package main

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/nyay-suraksha/backend/crypto"
)

func printHelp() {
	fmt.Println("==================================================")
	fmt.Println("🕵️‍♀️ NYAY SURAKSHA — STEGANOGRAPHY LEAK CATCHER 🕵️‍♀️")
	fmt.Println("==================================================")
	fmt.Println("Usage:")
	fmt.Println("  Encode: go run main.go encode <input_image> <badge_id> <output_image>")
	fmt.Println("  Decode: go run main.go decode <leaked_image>")
	fmt.Println("")
	fmt.Println("Example:")
	fmt.Println("  go run main.go encode evidence.png \"DL-4821\" safe_evidence.png")
	fmt.Println("  go run main.go decode safe_evidence.png")
	fmt.Println("==================================================")
}

func main() {
	if len(os.Args) < 3 {
		printHelp()
		os.Exit(1)
	}

	command := strings.ToLower(os.Args[1])

	switch command {
	case "encode":
		if len(os.Args) != 5 {
			fmt.Println("❌ Error: Invalid number of arguments for encode.")
			printHelp()
			os.Exit(1)
		}
		
		inputFile := os.Args[2]
		badgeID := os.Args[3]
		outputFile := os.Args[4]

		// 1. Open input file
		file, err := os.Open(inputFile)
		if err != nil {
			fmt.Printf("❌ Failed to open input file: %v\n", err)
			os.Exit(1)
		}
		defer file.Close()

		// 2. Determine format
		format := "png"
		if strings.HasSuffix(strings.ToLower(outputFile), ".jpg") || strings.HasSuffix(strings.ToLower(outputFile), ".jpeg") {
			format = "jpeg"
		}

		fmt.Printf("⏳ Encoding watermark '%s' into %s...\n", badgeID, inputFile)

		// 3. Encode watermark
		watermarkedBytes, err := crypto.EncodeWatermark(file, badgeID, format)
		if err != nil {
			fmt.Printf("❌ Failed to encode watermark: %v\n", err)
			os.Exit(1)
		}

		// 4. Save to output file
		err = os.WriteFile(outputFile, watermarkedBytes, 0644)
		if err != nil {
			fmt.Printf("❌ Failed to save output file: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("✅ SUCCESS: Watermarked image saved to %s\n", outputFile)
		fmt.Println("   (The watermark is invisible to the human eye)")

	case "decode":
		if len(os.Args) != 3 {
			fmt.Println("❌ Error: Invalid number of arguments for decode.")
			printHelp()
			os.Exit(1)
		}

		leakedFile := os.Args[2]

		// 1. Open leaked file
		file, err := os.Open(leakedFile)
		if err != nil {
			fmt.Printf("❌ Failed to open leaked file: %v\n", err)
			os.Exit(1)
		}
		defer file.Close()

		fmt.Printf("⏳ Analyzing %s for hidden watermarks...\n", leakedFile)

		// 2. Decode watermark
		badgeID, err := crypto.DecodeWatermark(file)
		if err != nil {
			if err == io.EOF {
				fmt.Println("✅ No watermark found. This image is clean.")
			} else {
				fmt.Printf("❌ Decoding failed or no watermark found: %v\n", err)
			}
			os.Exit(1)
		}

		fmt.Println("\n🚨 🚨 🚨 LEAK DETECTED 🚨 🚨 🚨")
		fmt.Printf("The following Badge ID was found hidden inside the pixel data:\n\n")
		fmt.Printf("   >> BADGE ID: %s <<\n\n", badgeID)
		fmt.Println("Action: Dispatching alert to Internal Vigilance.")

	default:
		fmt.Printf("❌ Unknown command: %s\n", command)
		printHelp()
		os.Exit(1)
	}
}
