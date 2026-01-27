"use client";

import { useRouter } from "next/navigation";
import HeaderBar from "../components/HeaderBar";
import ProgramCard from "../components/ProgramCard";
import { useGymStore } from "../../store/gym";
import { navigateWithTransition } from "../../lib/navigation";

export default function ProgramsPage() {
  const router = useRouter();
  const programs = useGymStore((state) => state.programs);
  const createProgram = useGymStore((state) => state.createProgram);

  const handleNewProgram = () => {
    const id = createProgram();
    navigateWithTransition(router, `/programs/${id}`);
  };

  return (
    <div className="page container">
      <HeaderBar title="Programs" />

      <div className="stack virtual-list">
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            meta={`${program.exerciseIds.length} exercises`}
            href={`/programs/${program.id}`}
            actionLabel="Edit"
          />
        ))}
      </div>

      <button type="button" className="btn btn--primary fab" onClick={handleNewProgram}>
        +
      </button>
    </div>
  );
}
