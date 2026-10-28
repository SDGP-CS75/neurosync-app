import { getDoc, setDoc } from "firebase/firestore";

import {
  ensureUserProfile,
  fallbackProfileFromUser,
} from "../../services/userProfile";

const user = {
  uid: "user-1",
  displayName: "Taylor User",
  email: "taylor@example.com",
  photoURL: "https://example.com/avatar.png",
} as never;

describe("user profile recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (setDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it("builds a usable fallback from Firebase Auth", () => {
    expect(fallbackProfileFromUser(user)).toMatchObject({
      firstName: "Taylor",
      lastName: "User",
      email: "taylor@example.com",
      photoURL: "https://example.com/avatar.png",
    });
  });

  it("creates a missing profile idempotently", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    });

    await expect(
      ensureUserProfile(user, {
        firstName: "Taylor",
        lastName: "User",
      })
    ).resolves.toMatchObject({
      firstName: "Taylor",
      lastName: "User",
      email: "taylor@example.com",
    });

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        firstName: "Taylor",
        lastName: "User",
        email: "taylor@example.com",
        createdAt: { __serverTimestamp: true },
      }),
      { merge: true }
    );
  });

  it("does not overwrite an existing profile", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        firstName: "Existing",
        lastName: "Name",
        email: "existing@example.com",
        photoURL: "https://example.com/existing.png",
        about: "Hello",
        age: "30",
      }),
    });

    await expect(
      ensureUserProfile(user, { firstName: "Ignored" })
    ).resolves.toMatchObject({
      firstName: "Existing",
      lastName: "Name",
      email: "existing@example.com",
      about: "Hello",
      age: "30",
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("fills only blank fields on a partial profile", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        firstName: "",
        lastName: "",
        email: "existing@example.com",
        photoURL: "",
      }),
    });

    await ensureUserProfile(user);

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      {
        firstName: "Taylor",
        lastName: "User",
        photoURL: "https://example.com/avatar.png",
      },
      { merge: true }
    );
  });
});
