import type { ReactNode } from "react";
export type LogoData = {
  xcolumn: string;
  xcomponent: string;
  xid: string;
  icon: ReactNode;
  text: string;
};
/** A logo. */
export default function Logo({ d, cids }: { d: LogoData; cids: string[] }) {
  return (
    <span data-cid={cids[0]} className="flex items-center gap-2">
      <svg data-cid={cids[1]} className="w-auto h-4.5 block overflow-hidden align-middle text-color-002" data-component="icon" aria-hidden="true" fill="none" height="18" stroke="currentColor" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" x-file-name="App" x-line-number="13" x-column={d.xcolumn} x-component={d.xcomponent} x-id={d.xid} x-dynamic="false">{d.icon}</svg>
      {d.text}
    </span>
  );
}
