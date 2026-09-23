export type TileData = {
  text: string;
};
/** A content tile. */
export default function Tile({ d, cids }: { d: TileData; cids: string[] }) {
  return (
    <option data-cid={cids[0]} className="min-h-6 block min-w-6 pb-px px-0.5 items-center gap-1.5 whitespace-nowrap">
      {d.text}
    </option>
  );
}
