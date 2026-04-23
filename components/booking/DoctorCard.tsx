import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Stethoscope, Check } from "lucide-react";

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
                "rounded-2xl border transition-all duration-200 cursor-pointer",
                selected
                    ? "border-primary/40 bg-primary/[0.04] shadow-sm"
                    : "border-black/[0.06] bg-white hover:border-black/[0.12] hover:shadow-sm"
            )}
            onClick={() => onSelect(doctor)}
        >
            <div className="p-4 flex gap-3">
                <div className="size-12 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0 overflow-hidden">
                    {doctor.avatarUrl ? (
                        <img src={doctor.avatarUrl} alt={doctor.name} className="size-full object-cover" />
                    ) : (
                        <Stethoscope className="size-5 text-[#6E6E73]" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1D1D1F] truncate">{doctor.name}</p>
                    {doctor.speciality && (
                        <p className="text-sm text-[#6E6E73] truncate">{doctor.speciality}</p>
                    )}
                    {doctor.bio && (
                        <p className="text-xs text-[#6E6E73] mt-1 line-clamp-2">{doctor.bio}</p>
                    )}
                </div>

                <div
                    className={cn(
                        "size-5 rounded-full border-2 shrink-0 mt-0.5 transition-all flex items-center justify-center",
                        selected ? "border-primary bg-primary" : "border-black/[0.15]"
                    )}
                >
                    {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                </div>
            </div>

            {selected && doctor.services.length > 0 && (
                <div className="px-4 pb-4 space-y-1.5">
                    <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wide">Выберите услугу</p>
                    {doctor.services.map((svc) => (
                        <button
                            key={svc.id}
                            onClick={(e) => { e.stopPropagation(); onServiceSelect(svc); }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-all",
                                selectedService?.id === svc.id
                                    ? "border-primary/50 bg-primary/[0.06] font-medium text-primary"
                                    : "border-black/[0.06] bg-white hover:bg-[#F5F5F7]"
                            )}
                        >
                            <span className="truncate">{svc.name}</span>
                            <span className="flex items-center gap-2 shrink-0 text-[#6E6E73] ml-2">
                                <Clock className="size-3" />
                                {svc.duration} мин
                                {svc.price != null && (
                                    <span className="font-semibold text-[#1D1D1F]">
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
