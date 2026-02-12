"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapIcon } from "lucide-react";
import type { SkillOrderConfig } from "@/types/guides";

export const SkillOrderSection = ({ skillOrder }: { skillOrder: SkillOrderConfig }) => {
  const hasData = Object.keys(skillOrder.levels).length > 0 || skillOrder.maxOrder.length > 0;

  if (!hasData) return null;

  const skills = ["Q", "W", "E", "R"] as const;
  const levels = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ZapIcon className="size-4 sm:size-5" />
          Ordre des compétences
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {skillOrder.maxOrder.length > 0 && (
          <div className="mb-3 sm:mb-4 px-2 sm:px-0">
            <span className="text-xs sm:text-sm text-muted-foreground">Priorité : </span>
            <span className="font-semibold text-sm sm:text-base">
              {skillOrder.maxOrder.join(" > ")}
            </span>
          </div>
        )}

        {Object.keys(skillOrder.levels).length > 0 && (
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="text-xs sm:text-sm" style={{ minWidth: "480px" }}>
              <thead>
                <tr>
                  <th className="text-left p-0.5 sm:p-1 w-8 sm:w-12"></th>
                  {levels.map((level) => (
                    <th
                      key={level}
                      className="text-center p-0.5 sm:p-1 w-6 sm:w-8 text-muted-foreground font-normal"
                    >
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill}>
                    <td className="font-semibold p-0.5 sm:p-1">{skill}</td>
                    {levels.map((level) => {
                      const isSelected = skillOrder.levels[level] === skill;
                      return (
                        <td key={level} className="text-center p-0.5 sm:p-1">
                          <div
                            className={`size-4 sm:size-6 rounded mx-auto ${
                              isSelected
                                ? skill === "R"
                                  ? "bg-yellow-500"
                                  : "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
