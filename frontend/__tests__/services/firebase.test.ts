describe("firebase service", () => {
  it("exports auth and db instances", () => {
    jest.resetModules();

    jest.doMock("firebase/app", () => ({
      initializeApp: jest.fn(() => ({ app: true })),
    }));

    jest.doMock("firebase/auth", () => ({
      getAuth: jest.fn(() => ({ auth: true })),
      initializeAuth: jest.fn(() => ({ auth: true })),
      getReactNativePersistence: jest.fn(() => ({})),
    }));

    jest.doMock("firebase/firestore", () => ({
      getFirestore: jest.fn(() => ({ db: true })),
    }));

    jest.doMock("react-native", () => ({
      Platform: { OS: "web" },
    }));

    const firebase = require("../../services/firebase");

    expect(firebase.auth).toEqual({ auth: true });
    expect(firebase.db).toEqual({ db: true });
  });
});
