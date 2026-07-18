import { CheckedIcon } from './LandingIcons'

export const FeatureTag = ({label, bgColor, dotColor}: { label: string; bgColor: string; dotColor: string}) => (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${bgColor}`}>
      <div className={`w-7 h-7 rounded-full ${dotColor} flex items-center justify-center shrink-0`}>
        <CheckedIcon color="white" />
      </div>
      <span className="text-[#5d5d5d] text-xs font-medium">{label}</span>
    </div>
);


