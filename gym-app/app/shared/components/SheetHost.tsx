"use client";

import EditSetSheet from "../../features/workout/components/EditSetSheet";
import ConfirmSheet from "../../features/settings/components/ConfirmSheet";
import SearchExerciseSheet from "../../features/programs/components/SearchExerciseSheet";

export default function SheetHost() {
  return (
    <>
      <EditSetSheet />
      <ConfirmSheet />
      <SearchExerciseSheet />
    </>
  );
}
