/** Feature flags resolving discrepancies between the PNG render and the PDF (see CLAUDE.md §2). */
export type GrinderStyle = 'blades' | 'triple-roller';

export const FLAGS: { GRINDER_STYLE: GrinderStyle; SECOND_MILL: boolean } = {
  /** PNG shows a horizontal shaft with star blades; PDF Fig.3 shows three interlocking rollers. */
  GRINDER_STYLE: 'blades',
  /** PDF Fig.2 has a second (fine) milling stage before collection. */
  SECOND_MILL: false,
};
