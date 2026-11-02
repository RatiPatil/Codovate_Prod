import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
const fake = vi.hoisted(() => ({ listeners: {}, stops: [], admin: true }));
vi.mock("./firebase", () => ({db:{}}));
vi.mock("./session",()=>({useSession:()=>({user:{uid:"operator"},admin:fake.admin})}));
vi.mock("firebase/firestore",()=>({collection:(_db,path)=>path,onSnapshot:(path,_opts,next,fail)=>{fake.listeners[path]={next,fail};const stop=vi.fn();fake.stops.push(stop);return stop;}}));
import { AdminLiveSummary } from "./AdminLiveSummary";
afterEach(()=>{cleanup();fake.listeners={};fake.stops=[];fake.admin=true;});
it("updates live summaries, opens modules and unsubscribes",()=>{
 const open=vi.fn(), view=render(<AdminLiveSummary open={open}/>);
 act(()=>fake.listeners.opportunities.next({size:12,metadata:{fromCache:false}}));
 expect(screen.getByText("12")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:/Opportunities/}));expect(open).toHaveBeenCalledWith("listings");
 act(()=>fake.listeners.opportunities.fail());expect(screen.getByText("Unavailable")).toBeTruthy();
 view.unmount();expect(fake.stops.every(stop=>stop.mock.calls.length===1)).toBe(true);
});
it("does not subscribe for student accounts",()=>{fake.admin=false;render(<AdminLiveSummary open={vi.fn()}/>);expect(Object.keys(fake.listeners)).toHaveLength(0);});
