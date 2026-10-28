import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { uploadProfileImage } from "../../services/profileImage";

describe("profile image upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uploadBytes as jest.Mock).mockResolvedValue(undefined);
    (getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/avatar.png"
    );
  });

  it("uploads a supported image to the user-scoped avatar path", async () => {
    const file = new Blob(["image"], { type: "image/png" });

    await expect(
      uploadProfileImage("user-1", {
        uri: "blob:preview",
        mimeType: "image/png",
        fileName: "avatar.png",
        file,
      })
    ).resolves.toBe("https://example.com/avatar.png");

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      "users/user-1/profile/avatar"
    );
    expect(uploadBytes).toHaveBeenCalledWith(
      { path: "profile-image" },
      file,
      expect.objectContaining({ contentType: "image/png" })
    );
    expect(getDownloadURL).toHaveBeenCalledWith({ path: "profile-image" });
  });

  it("rejects oversized images before upload", async () => {
    const oversized = {
      size: 5 * 1024 * 1024 + 1,
      type: "image/png",
    } as Blob;

    await expect(
      uploadProfileImage("user-1", {
        uri: "blob:preview",
        mimeType: "image/png",
        file: oversized,
      })
    ).rejects.toThrow("smaller than 5 MB");
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it("rejects unsupported file types", async () => {
    const file = new Blob(["document"], { type: "application/pdf" });

    await expect(
      uploadProfileImage("user-1", {
        uri: "blob:preview",
        mimeType: "application/pdf",
        fileName: "resume.pdf",
        file,
      })
    ).rejects.toThrow("JPEG, PNG, WebP");
    expect(uploadBytes).not.toHaveBeenCalled();
  });
});
