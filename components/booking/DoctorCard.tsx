import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Stethoscope } from "lucide-react";

interface Service {
    id: string;
    name: string;
    duration: number;
    price?: number | null;
}

interface Doctor {
    id: string;
    name: string;
    speciality?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    services: Service[];
}

interface Props {
    doctor: Doctor;
    selected: boolean;
    selectedService?: Service | null;
    onSelect: (doctor: Doctor) => void;
    onServiceSelect: (service: Service) => void;
}

export function DoctorCard({ doctor, selected, selectedService, onSelect, onServiceSelect }: Props) {
    return (
        <div
            className={cn(
                "rounded-2xl border transition-all cursor-pointer",
                selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:bg-muted/40"
            )}
            onClick={() => onSelect(doctor)}
        >
            <div className="p-4 flex gap-3">
                {/* Avatar */}
                <div className="size-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {doctor.avatarUrl ? (
                        <img src={doctor.avatarUrl} alt={doctor.name} className="size-full object-cover" />
                    ) : (
                        <Stethoscope className="size-5 text-muted-foreground" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{doctor.name}</p>
                    {doctor.speciality && (
                        <p className="text-sm text-muted-foreground truncate">{doctor.speciality}</p>
                    )}
                    {doctor.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doctor.bio}</p>
                    )}
                </div>

                {/* Selection indicator */}
                <div
                    className={cn(
                        "size-5 rounded-full border-2 shrink-0 mt-0.5 transition-all",
                        selected ? "border-primary bg-primary" : "border-border"
                    )}
                >
                    {selected && (
                        <svg viewBox="0 0 20 20" fill="white" className="size-full p-0.5">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {/* Services — shown when doctor selected */}
            {selected && doctor.services.length > 0 && (
                <div className="px-4 pb-4 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Выберите услугу
                    </p>
                    {doctor.services.map((svc) => (
                        <button
                            key={svc.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onServiceSelect(svc);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm border transition-all",
                                selectedService?.id === svc.id
                                    ? "border-primary bg-primary/5 font-medium"
                                    : "border-border hover:bg-muted"
                            )}
                        >
                            <span className="truncate">{svc.name}</span>
                            <span className="flex items-center gap-2 shrink-0 text-muted-foreground ml-2">
                <Clock className="size-3" />
                                {svc.duration} мин
                                {svc.price != null && (
                                    <span className="font-medium text-foreground">
                    {svc.price.toLocaleString("ru-RU")} ₽
                  </span>
                                )}
              </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}