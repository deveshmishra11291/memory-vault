# MemoryVault iOS App Store Submission & Copyright Compliance Guide

## 1. Solution A: iOS Share Sheet ("Share to Vault")
Instead of requiring general consumers to download a 5GB ZIP file via Meta Accounts Center and transferring it via laptop:
1. **The Flow:** When browsing Instagram (or TikTok / Camera Roll), the user taps the native iOS **Share** button (`UIActivityViewController`).
2. **The Ingest:** Under apps, they select **"MemoryVault"**.
3. **The Magic:** `ShareViewController.swift` loads the video/photo or link and POSTs it directly to your encrypted private vault at `/api/share-extension`.
4. **The Result:** The memory is automatically framed as a **Collectible VaultCard** with 3D tilt, holo sheen, and attached soundtrack!

---

## 2. Strict Copyright Compliance (Zero Copyright Strikes)

To ensure smooth App Store Review and zero copyright or trademark infringement:

| Original Element | Protected Precedent | How MemoryVault Remains 100% Original & Safe |
| :--- | :--- | :--- |
| **Card Frame** | Konami / Yu-Gi-Oh! TCG | Custom CSS procedural gradients (`#b83375` to `#541538`). No kanji glyphs, no Konami logos, no proprietary card layout dimensions. |
| **Header Banner** | Yu-Gi-Oh attribute circle | Original square inset banner with custom mood gem (e.g. `[ STORY ]`, `[ SNAP ]`). |
| **Sub-Header** | `[ Trap Card ]` / `[ Spell Card ]` | Original taxonomy: `[ Story Card ]`, `[ Memory Card ]`, `[ Night Card ]`. |
| **Authentication Foil** | Eye of Anubis hologram stamp | Custom gold polygon with `★` and serial code `#VLT-0842 • PRIVATE VAULT`. |
| **Music Gadget** | Winamp / Microsoft Win95 | Retro Silk Sonic gadget aesthetic built with modern Lucide icons, custom CSS beveled insets, and standard HTML5 audio APIs. |
| **Platform Integration** | Meta / Instagram | Zero scraping, zero private Meta APIs, zero simulated logins. Everything uses sanctioned Apple `NSExtensionPointIdentifier` (com.apple.share-services). |

---

## 3. Apple App Store Submission Checklist

### App Store Connect Configuration
- **Category:** Photo & Video / Lifestyle
- **Content Rights:** Yes, you own the code and UI assets.
- **Privacy Policy (Nutrition Label):**
  - **Data Used to Track You:** None (0).
  - **Data Linked to You:** None.
  - **Data Not Linked to You:** Diagnostics (optional crash reports).
  - **User Content:** Stored locally on the user's device (`FileManager`) and encrypted private storage.

### Capabilities in Xcode
1. In Xcode target **MemoryVault**, enable **App Groups**: `group.com.memoryvault.app`.
2. In target **MemoryVaultShare**, enable the matching App Group: `group.com.memoryvault.app`.
3. Set `NSExtensionActivationSupportsMovieWithMaxCount` to `10`.
4. Run `archive` and distribute via **TestFlight** for internal verification before requesting final App Store review.
