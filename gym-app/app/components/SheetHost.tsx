"use client";

import EditSetSheet from "./EditSetSheet";
import ConfirmSheet from "./ConfirmSheet";
import SearchExerciseSheet from "./SearchExerciseSheet";

export default function SheetHost() {
  return (
    <>
      <EditSetSheet />
      <ConfirmSheet />
      <SearchExerciseSheet />
    </>
  );
}
