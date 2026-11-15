//
//  ShareViewController.swift
//  MemoryVault Share Extension (iOS)
//
//  Solution A: 1-Tap "Share to Vault" from Instagram, TikTok, or Photos
//  Replaces manual ZIP archives with zero-hassle native iOS action sheet.
//

import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: SLComposeServiceViewController {
    
    // Configure with your production domain or local testing endpoint
    let vaultEndpoint = "https://your-domain.com/api/share-extension"
    let appGroupSuite = "group.com.memoryvault.app"

    override func isContentValid() -> Bool {
        // Can perform title validation or album checking
        return true
    }

    override func didSelectPost() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments,
              !attachments.isEmpty else {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }

        let itemProvider = attachments[0]
        let postTitle = contentText?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "Shared Instagram Memory"

        // 1. Check if the user shared a Movie / Video (Instagram Reel or Story)
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.movie.identifier, options: nil) { [weak self] (item, error) in
                guard let self = self else { return }
                if let url = item as? URL {
                    self.uploadMediaFile(fileURL: url, title: postTitle, isVideo: true)
                } else {
                    self.finishExtension()
                }
            }
        }
        // 2. Check if the user shared a Photo / Image
        else if itemProvider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] (item, error) in
                guard let self = self else { return }
                if let url = item as? URL {
                    self.uploadMediaFile(fileURL: url, title: postTitle, isVideo: false)
                } else if let image = item as? UIImage {
                    self.uploadUIImage(image: image, title: postTitle)
                } else {
                    self.finishExtension()
                }
            }
        }
        // 3. Check if the user shared an Instagram Web URL
        else if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                guard let self = self else { return }
                if let sharedURL = item as? URL {
                    self.sendSharedURL(url: sharedURL, title: postTitle)
                } else {
                    self.finishExtension()
                }
            }
        } else {
            self.finishExtension()
        }
    }

    private func uploadMediaFile(fileURL: URL, title: String, isVideo: Bool) {
        guard let serverURL = URL(string: vaultEndpoint) else {
            finishExtension()
            return
        }

        var request = URLRequest(url: serverURL)
        request.httpMethod = "POST"
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        let filename = fileURL.lastPathComponent
        let mimeType = isVideo ? "video/mp4" : "image/jpeg"

        // Add file parameter
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        
        if let fileData = try? Data(contentsOf: fileURL) {
            body.append(fileData)
        }
        body.append("\r\n".data(using: .utf8)!)

        // Add title parameter
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"title\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(title)\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let task = URLSession.shared.dataTask(with: request) { [weak self] (_, _, _) in
            DispatchQueue.main.async {
                self?.finishExtension()
            }
        }
        task.resume()
    }

    private func uploadUIImage(image: UIImage, title: String) {
        guard let imageData = image.jpegData(compressionQuality: 0.9),
              let tempURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.appendingPathComponent("share_\(Date().timeIntervalSince1970).jpg") else {
            finishExtension()
            return
        }
        try? imageData.write(to: tempURL)
        uploadMediaFile(fileURL: tempURL, title: title, isVideo: false)
    }

    private func sendSharedURL(url: URL, title: String) {
        guard let serverURL = URL(string: vaultEndpoint) else {
            finishExtension()
            return
        }

        var request = URLRequest(url: serverURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "url": url.absoluteString,
            "title": title
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: payload, options: [])

        let task = URLSession.shared.dataTask(with: request) { [weak self] (_, _, _) in
            DispatchQueue.main.async {
                self?.finishExtension()
            }
        }
        task.resume()
    }

    private func finishExtension() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    override func configurationItems() -> [Any]! {
        // Optional: Add album selection dropdown inside native iOS Share sheet
        return []
    }
}
