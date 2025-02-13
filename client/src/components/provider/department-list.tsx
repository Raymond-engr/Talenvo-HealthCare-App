import { Stethoscope, Baby, Bone, Heart, Activity } from "lucide-react"

const departments = [
  {
    name: "Oncology",
    description: "Specialized cancer treatment and care",
    icon: Activity,
  },
  {
    name: "Pediatrics",
    description: "Comprehensive healthcare for children",
    icon: Baby,
  },
  {
    name: "Orthopedics",
    description: "Bone and joint care specialists",
    icon: Bone,
  },
  {
    name: "Cardiology",
    description: "Heart and cardiovascular care",
    icon: Heart,
  },
  {
    name: "General Medicine",
    description: "Primary healthcare services",
    icon: Stethoscope,
  },
]

export function DepartmentList() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {departments.map((dept) => {
        const Icon = dept.icon
        return (
          <div
            key={dept.name}
            className="p-4 border rounded-lg flex items-start gap-4 hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600" />
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

