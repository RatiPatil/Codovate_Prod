import { it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
const fake = vi.hoisted(() => ({ next: null, fail: null, stop: vi.fn() }));
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({ doc: vi.fn(), onSnapshot: (_r,_o,next,fail) => { fake.next=next; fake.fail=fail; return fake.stop; } }));
import { CommunityCount } from "./CommunityCount";
afterEach(cleanup);
window.matchMedia = () => ({ matches: true });
it("updates the public aggregate live without inventing a count", () => {
 const view=render(<CommunityCount/>);
 expect(screen.getByText("Join our learning community")).toBeTruthy();
 act(() => fake.next({exists:()=>true,data:()=>({registeredStudents:1479}),metadata:{fromCache:false}}));
 expect(screen.getByText("1,479+ registered members")).toBeTruthy();
 act(() => fake.next({exists:()=>true,data:()=>({registeredStudents:1480}),metadata:{fromCache:true}}));
 expect(screen.getByText("1,480+ registered members")).toBeTruthy();
 expect(screen.getByText(/last saved count/)).toBeTruthy();
 view.unmount();expect(fake.stop).toHaveBeenCalled();
});
it("clears failed or invalid counts", () => {
 render(<CommunityCount/>);
 act(()=>fake.next({exists:()=>true,data:()=>({registeredStudents:-1}),metadata:{fromCache:false}}));
 expect(screen.getByText("Join our learning community")).toBeTruthy();
 act(()=>fake.fail());expect(screen.queryByText(/registered members/)).toBeNull();
});
