// client/src/components/provider/department-list.tsx (updated)
import { Activity, Baby, Bone, Heart, Stethoscope } from "lucide-react"

// Map department names to icons
const departmentIconMap = {
  "Oncology": Activity,
  "Pediatrics": Baby,
  "Orthopedics": Bone,
  "Cardiology": Heart,
  "General Medicine": Stethoscope,
  // Add more mappings as needed
};

// Default fallback icon
const defaultIcon = Activity;

interface Department {
  name: string;
  description: string;
  icon?: string;
}

interface DepartmentListProps {
  departments?: Department[];
}

export function DepartmentList({ departments }: DepartmentListProps) {
  // Default departments if none provided
  const deptList = departments || [
    {
      name: "Oncology",
      description: "Specialized care for heart and blood vessel conditions.",
    },
    {
      name: "Pediatrics",
      description: "Comprehensive healthcare for infants, children.",
    },
    {
      name: "Orthopedics",
      description: "Comprehensive healthcare for infants, children.",
    },
    {
      name: "General Medicine",
      description: "Comprehensive healthcare for infants, children.",
    },
    {
      name: "Maternity Care",
      description: "Comprehensive healthcare for infants, children.",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {deptList.map((dept) => {
        // Get icon from map or use default
        const IconComponent = departmentIconMap[dept.name as keyof typeof departmentIconMap] || defaultIcon;
        
        return (
          <div
            key={dept.name}
            className="p-4 border rounded-lg flex items-start gap-4 hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconComponent className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{dept.name}</h3>
              <p className="text-sm text-gray-600">{dept.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}