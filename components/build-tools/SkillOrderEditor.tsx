"use client";

import { cn } from "@/lib/utils";
import type { SkillOrderConfig, SkillKey } from "@/types/guides";

interface SkillOrderEditorProps {
  value: SkillOrderConfig;
  onChange: (value: SkillOrderConfig) => void;
  className?: string;
}

const SKILLS: SkillKey[] = ["Q", "W", "E", "R"];
const LEVELS = Array.from({ length: 18 }, (_, i) => i + 1);
const R_LEVELS = [6, 11, 16]; // Levels where R can be upgraded

const SKILL_COLORS: Record<SkillKey, string> = {
  Q: "bg-blue-500 hover:bg-blue-600",
  W: "bg-green-500 hover:bg-green-600",
  E: "bg-orange-500 hover:bg-orange-600",
  R: "bg-yellow-500 hover:bg-yellow-600",
};

export const SkillOrderEditor = ({
  value,
  onChange,
  className,
}: SkillOrderEditorProps) => {
  const handleCellClick = (level: number, skill: SkillKey) => {
    // R can only be selected at levels 6, 11, 16
    if (skill === "R" && !R_LEVELS.includes(level)) {
      return;
    }

    const currentSkill = value.levels[level];

    // Toggle: if same skill, remove it; otherwise, set it
    const newLevels = { ...value.levels };
    if (currentSkill === skill) {
      delete newLevels[level];
    } else {
      newLevels[level] = skill;
    }

    onChange({ ...value, levels: newLevels });
  };

  const handleMaxOrderChange = (index: number, skill: "Q" | "W" | "E") => {
    const newMaxOrder = [...value.maxOrder];

    // Remove the skill if it's already in the array
    const existingIndex = newMaxOrder.indexOf(skill);
    if (existingIndex !== -1) {
      newMaxOrder.splice(existingIndex, 1);
    }

    // Add it at the new position
    newMaxOrder.splice(index, 0, skill);

    // Keep only 3 skills max
    onChange({ ...value, maxOrder: newMaxOrder.slice(0, 3) as ("Q" | "W" | "E")[] });
  };

  // Count skills selected
  const skillCounts: Record<SkillKey, number> = { Q: 0, W: 0, E: 0, R: 0 };
  Object.values(value.levels).forEach((skill) => {
    if (skill) skillCounts[skill]++;
  });

  // Skill limits: Q/W/E max 5, R max 3
  const getMaxForSkill = (skill: SkillKey) => (skill === "R" ? 3 : 5);

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Max Order Selection */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          Priorité max :
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-muted-foreground text-xs sm:text-sm">&gt;</span>
              )}
              <select
                value={value.maxOrder[index] || ""}
                onChange={(e) =>
                  handleMaxOrderChange(index, e.target.value as "Q" | "W" | "E")
                }
                className="h-8 w-12 sm:w-14 rounded border bg-background px-1 sm:px-2 text-sm"
              >
                <option value="">-</option>
                {(["Q", "W", "E"] as const).map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Order Grid */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <table className="text-xs sm:text-sm border-collapse" style={{ minWidth: "500px" }}>
          <thead>
            <tr>
              <th className="text-left p-0.5 sm:p-1 w-10 sm:w-16 text-muted-foreground font-medium">
                Skill
              </th>
              {LEVELS.map((level) => (
                <th
                  key={level}
                  className="text-center p-0.5 sm:p-1 w-6 sm:w-8 text-muted-foreground font-normal"
                >
                  {level}
                </th>
              ))}
              <th className="text-center p-0.5 sm:p-1 w-10 sm:w-12 text-muted-foreground font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((skill) => {
              const count = skillCounts[skill];
              const max = getMaxForSkill(skill);
              const isFull = count >= max;

              return (
                <tr key={skill}>
                  <td className="p-0.5 sm:p-1 font-semibold">{skill}</td>
                  {LEVELS.map((level) => {
                    const isSelected = value.levels[level] === skill;
                    const isRLevel = R_LEVELS.includes(level);
                    const isDisabled =
                      skill === "R" ? !isRLevel : false;
                    const canSelect = !isFull || isSelected;

                    return (
                      <td key={level} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => handleCellClick(level, skill)}
                          disabled={isDisabled || (!isSelected && !canSelect)}
                          className={cn(
                            "size-5 sm:size-6 rounded transition-all mx-auto block",
                            isSelected
                              ? SKILL_COLORS[skill]
                              : "bg-muted hover:bg-muted-foreground/20",
                            isDisabled && "opacity-30 cursor-not-allowed",
                            !isSelected && !canSelect && "opacity-50 cursor-not-allowed"
                          )}
                          title={
                            isDisabled
                              ? "R uniquement aux niveaux 6, 11, 16"
                              : isSelected
                                ? `Retirer ${skill} au niveau ${level}`
                                : `Ajouter ${skill} au niveau ${level}`
                          }
                        />
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "text-center p-0.5 sm:p-1 font-medium text-xs sm:text-sm",
                      isFull ? "text-green-500" : "text-muted-foreground"
                    )}
                  >
                    {count}/{max}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Cliquez sur les cellules pour définir l&apos;ordre. R : niveaux 6, 11, 16 uniquement.
      </p>
    </div>
  );
};
