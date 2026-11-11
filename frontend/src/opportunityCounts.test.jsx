import {afterEach,expect,it,vi} from "vitest";
import {cleanup,renderHook,waitFor} from "@testing-library/react";
const fake=vi.hoisted(()=>({get:vi.fn(),where:vi.fn((...args)=>args),now:vi.fn(()=>"cutoff")}));
vi.mock('./firebase',()=>({configured:true,db:{}}));
vi.mock('firebase/firestore',()=>({collection:()=>"opportunities",query:(...args)=>args,where:fake.where,Timestamp:{now:fake.now},getCountFromServer:fake.get}));
import {useOpportunityCounts} from './opportunityCounts';
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('counts the full published, unexpired category rather than a loaded page',async()=>{
 fake.get.mockResolvedValue({data:()=>({count:123})});
 const {result}=renderHook(()=>useOpportunityCounts());
 await waitFor(()=>expect(result.current.loading).toBe(false));
 expect(result.current.counts).toEqual({internship:123,job:123,competition:123,hackathon:123});
 expect(fake.where).toHaveBeenCalledWith('status','==','published');
 expect(fake.where).toHaveBeenCalledWith('closesAt','>','cutoff');
 expect(fake.get).toHaveBeenCalledTimes(4);
 window.dispatchEvent(new Event('focus'));
 await waitFor(()=>expect(fake.get).toHaveBeenCalledTimes(8));
});
it('shows an unavailable count instead of inventing zero after a query failure',async()=>{
 fake.get.mockRejectedValue({code:'failed-precondition'});
 const {result}=renderHook(()=>useOpportunityCounts());
 await waitFor(()=>expect(result.current.loading).toBe(false));
 expect(result.current.counts.job).toBeNull();
});
