import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { loginUser, logoutUser, signUpUser } from "../../services/auth";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

describe("auth service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in a user", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: "user-1" },
    });

    await expect(loginUser("test@example.com", "secret")).resolves.toEqual({
      uid: "user-1",
    });
  });

  it("signs up a user", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: "user-2" },
    });
    (updateProfile as jest.Mock).mockResolvedValue(undefined);

    await expect(signUpUser("test@example.com", "secret", {
      firstName: "Taylor",
      lastName: "User",
    })).resolves.toEqual({
      uid: "user-2",
    });
    expect(updateProfile).toHaveBeenCalledWith(
      { uid: "user-2" },
      { displayName: "Taylor User" }
    );
  });

  it("logs out a user", async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await expect(logoutUser()).resolves.toBe(true);
  });
});
