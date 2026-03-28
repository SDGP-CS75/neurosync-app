import { deleteDoc, getDocs, setDoc } from "firebase/firestore";

import {
  deleteTemplate,
  getTemplates,
  saveTemplate,
} from "../../services/templateStorage";

jest.mock("../../services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
}));

describe("template storage service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves a task as a template", async () => {
    const task = {
      title: "Morning routine",
      category: "Personal",
      icon: "☀️",
      iconBg: "#fef3c7",
      subtasks: [
        {
          id: "step-1",
          text: "Hydrate",
          isGenarated: false,
          isDone: true,
        },
      ],
    } as never;

    const template = await saveTemplate("user-1", task);

    expect(template?.title).toBe("Morning routine");
    expect(setDoc).toHaveBeenCalled();
  });

  it("returns saved templates", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({ id: "tpl-1", title: "Morning routine" }),
        },
      ],
    });

    await expect(getTemplates("user-1")).resolves.toEqual([
      { id: "tpl-1", title: "Morning routine" },
    ]);
  });

  it("deletes a template", async () => {
    await deleteTemplate("user-1", "tpl-1");
    expect(deleteDoc).toHaveBeenCalled();
  });
});
