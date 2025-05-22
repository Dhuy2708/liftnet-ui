"use client"

import { useState, useRef, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import {
  Weight,
  Ruler,
  Percent,
  Flame,
  Dumbbell,
  ChevronRight,
  MessageSquare,
  X,
  Send,
  Info,
  CheckCircle2,
} from "lucide-react"

// Define CSS variables and styles
const styles = {
  primary: "#de9151",
  primaryForeground: "white",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  border: "#e5e5e5",
  background: "white",
  foreground: "black",
  card: "white",
  cardForeground: "black",
  radius: "0.5rem",
}

// Define muscle groups and their data
const muscleGroups = {
  chest: {
    name: "Chest (Pectoralis)",
    description:
      "The pectoralis major is a thick, fan-shaped muscle that makes up the bulk of the chest muscles. It's involved in movements of the shoulder joint, including flexion, adduction, and rotation.",
    exercises: ["Bench Press", "Push-ups", "Chest Fly", "Dips"],
    color: styles.primary, // primary color
    icon: "💪",
    position: "front",
  },
  upperChest: {
    name: "Upper Chest (Clavicular)",
    description:
      "The upper portion of the pectoralis major, also known as the clavicular head. It's responsible for shoulder flexion and is targeted with incline pressing movements.",
    exercises: ["Incline Bench Press", "Incline Dumbbell Fly", "Cable Crossover (High to Low)"],
    color: styles.primary, // primary color
    icon: "⬆️",
    position: "front",
  },
  back: {
    name: "Back (Latissimus Dorsi)",
    description:
      "The latissimus dorsi is a large, flat muscle on the back that helps with shoulder extension and internal rotation. It's one of the widest muscles in the human body.",
    exercises: ["Pull-ups", "Rows", "Lat Pulldowns", "Deadlifts"],
    color: styles.primary, // primary color
    icon: "🔙",
    position: "back",
  },
  traps: {
    name: "Trapezius",
    description:
      "The trapezius is a large superficial muscle that extends from the back of the head down to the mid-back and across the shoulder blade. It's involved in moving, rotating, and stabilizing the shoulder blade.",
    exercises: ["Shrugs", "Face Pulls", "Upright Rows", "Rack Pulls"],
    color: styles.primary, // primary color
    icon: "🔺",
    position: "back",
  },
  shoulders: {
    name: "Shoulders (Deltoids)",
    description:
      "The deltoid is a triangular muscle that caps the shoulder. It consists of three parts: anterior, lateral, and posterior, which work together to allow various shoulder movements.",
    exercises: ["Overhead Press", "Lateral Raises", "Front Raises", "Reverse Fly"],
    color: styles.primary, // primary color
    icon: "🔄",
    position: "both",
  },
  rearDelts: {
    name: "Rear Deltoids",
    description:
      "The posterior portion of the deltoid muscle. This part of the shoulder is often underdeveloped and is important for shoulder health and posture.",
    exercises: ["Face Pulls", "Reverse Fly", "Bent-Over Lateral Raises", "Band Pull-Aparts"],
    color: styles.primary, // primary color
    icon: "🔙",
    position: "back",
  },
  biceps: {
    name: "Biceps",
    description:
      "The biceps brachii is a two-headed muscle on the upper arm that flexes the elbow and supinates the forearm. It's one of the most visible muscles when developed.",
    exercises: ["Bicep Curls", "Hammer Curls", "Chin-Ups", "Preacher Curls"],
    color: styles.primary, // primary color
    icon: "💪",
    position: "front",
  },
  triceps: {
    name: "Triceps",
    description:
      "The triceps brachii is a three-headed muscle on the back of the upper arm that extends the elbow. It makes up about two-thirds of the upper arm mass.",
    exercises: ["Tricep Pushdowns", "Skull Crushers", "Dips", "Close-Grip Bench Press"],
    color: styles.primary, // primary color
    icon: "🔽",
    position: "back",
  },
  forearms: {
    name: "Forearms",
    description:
      "The forearm contains multiple muscles that control wrist, hand, and finger movements. Strong forearms improve grip strength and are essential for many daily activities.",
    exercises: ["Wrist Curls", "Reverse Wrist Curls", "Farmer's Walks", "Deadhangs"],
    color: styles.primary, // primary color
    icon: "✊",
    position: "both",
  },
  abs: {
    name: "Abdominals",
    description:
      "The abdominal muscles include the rectus abdominis, external obliques, internal obliques, and transversus abdominis. They support the spine, enable torso movement, and protect internal organs.",
    exercises: ["Crunches", "Planks", "Leg Raises", "Russian Twists"],
    color: styles.primary, // primary color
    icon: "🧩",
    position: "front",
  },
  obliques: {
    name: "Obliques",
    description:
      "The external and internal oblique muscles run along the sides of the rectus abdominis. They allow the trunk to twist and provide lateral flexion of the spine.",
    exercises: ["Russian Twists", "Side Planks", "Woodchoppers", "Bicycle Crunches"],
    color: styles.primary, // primary color
    icon: "↔️",
    position: "front",
  },
  lowerBack: {
    name: "Lower Back (Erector Spinae)",
    description:
      "The erector spinae is a group of muscles that run along the spine. They help with extension of the spine and are crucial for posture and core stability.",
    exercises: ["Hyperextensions", "Good Mornings", "Superman", "Deadlifts"],
    color: styles.primary, // primary color
    icon: "⬇️",
    position: "back",
  },
  glutes: {
    name: "Glutes",
    description:
      "The gluteal muscles consist of the gluteus maximus, medius, and minimus. They're the largest muscles in the body and are responsible for hip extension, abduction, and rotation.",
    exercises: ["Squats", "Hip Thrusts", "Glute Bridges", "Lunges"],
    color: styles.primary, // primary color
    icon: "🍑",
    position: "back",
  },
  quads: {
    name: "Quadriceps",
    description:
      "The quadriceps femoris is a group of four muscles at the front of the thigh that extend the knee and flex the hip. They're crucial for walking, running, jumping, and squatting.",
    exercises: ["Squats", "Leg Extensions", "Lunges", "Leg Press"],
    color: styles.primary, // primary color
    icon: "🦵",
    position: "front",
  },
  hamstrings: {
    name: "Hamstrings",
    description:
      "The hamstrings are three muscles at the back of the thigh that flex the knee and extend the hip. They're important for activities like running, jumping, and maintaining posture.",
    exercises: ["Deadlifts", "Leg Curls", "Romanian Deadlifts", "Good Mornings"],
    color: styles.primary, // primary color
    icon: "🦵",
    position: "back",
  },
  calves: {
    name: "Calves (Gastrocnemius)",
    description:
      "The gastrocnemius is a two-headed muscle that forms the bulk of the calf. Along with the soleus, it plantar flexes the foot at the ankle joint and flexes the leg at the knee joint.",
    exercises: ["Calf Raises", "Jump Rope", "Box Jumps", "Seated Calf Raises"],
    color: styles.primary, // primary color
    icon: "👟",
    position: "both",
  },
  shins: {
    name: "Tibialis Anterior",
    description:
      "The tibialis anterior runs along the shin and is responsible for dorsiflexion (lifting the foot upward). It's important for balance, walking, and preventing shin splints.",
    exercises: ["Tibialis Raises", "Toe Taps", "Dorsiflexion with Resistance Band", "Walking on Heels"],
    color: styles.primary, // primary color
    icon: "🦶",
    position: "front",
  },
  neck: {
    name: "Neck Muscles",
    description:
      "The neck contains multiple muscles including the sternocleidomastoid and trapezius. These muscles control head movements and are important for posture and stability.",
    exercises: ["Neck Flexion", "Neck Extension", "Lateral Neck Flexion", "Isometric Holds"],
    color: styles.primary, // primary color
    icon: "🧠",
    position: "both",
  },
}

// Define workout splits
const workoutSplits = [
  {
    name: "Push/Pull/Legs",
    description: "A 3-day split focusing on pushing movements, pulling movements, and leg exercises.",
    frequency: "3-6 days per week",
    suitable: "Beginners to advanced",
    days: [
      {
        name: "Push Day",
        focus: "Chest, Shoulders, Triceps",
        exercises: [
          { name: "Bench Press", sets: "3-4", reps: "8-12" },
          { name: "Overhead Press", sets: "3", reps: "8-12" },
          { name: "Incline Dumbbell Press", sets: "3", reps: "10-15" },
          { name: "Lateral Raises", sets: "3", reps: "12-15" },
          { name: "Tricep Pushdowns", sets: "3", reps: "12-15" },
          { name: "Overhead Tricep Extension", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Pull Day",
        focus: "Back, Biceps, Rear Delts",
        exercises: [
          { name: "Deadlifts", sets: "3-4", reps: "6-10" },
          { name: "Pull-ups/Lat Pulldowns", sets: "3", reps: "8-12" },
          { name: "Barbell Rows", sets: "3", reps: "8-12" },
          { name: "Face Pulls", sets: "3", reps: "12-15" },
          { name: "Bicep Curls", sets: "3", reps: "10-15" },
          { name: "Hammer Curls", sets: "3", reps: "10-15" },
        ],
      },
      {
        name: "Leg Day",
        focus: "Quads, Hamstrings, Calves, Glutes",
        exercises: [
          { name: "Squats", sets: "3-4", reps: "8-12" },
          { name: "Romanian Deadlifts", sets: "3", reps: "8-12" },
          { name: "Leg Press", sets: "3", reps: "10-15" },
          { name: "Leg Curls", sets: "3", reps: "12-15" },
          { name: "Calf Raises", sets: "4", reps: "15-20" },
          { name: "Glute Bridges", sets: "3", reps: "12-15" },
        ],
      },
    ],
  },
  {
    name: "Upper/Lower",
    description: "A 4-day split alternating between upper body and lower body workouts.",
    frequency: "4 days per week",
    suitable: "Beginners to advanced",
    days: [
      {
        name: "Upper Body A",
        focus: "Chest, Back, Shoulders, Arms",
        exercises: [
          { name: "Bench Press", sets: "4", reps: "6-10" },
          { name: "Barbell Rows", sets: "4", reps: "6-10" },
          { name: "Overhead Press", sets: "3", reps: "8-12" },
          { name: "Pull-ups/Lat Pulldowns", sets: "3", reps: "8-12" },
          { name: "Lateral Raises", sets: "3", reps: "12-15" },
          { name: "Tricep Pushdowns", sets: "3", reps: "12-15" },
          { name: "Bicep Curls", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Lower Body A",
        focus: "Quads, Hamstrings, Calves, Glutes",
        exercises: [
          { name: "Squats", sets: "4", reps: "6-10" },
          { name: "Romanian Deadlifts", sets: "3", reps: "8-12" },
          { name: "Leg Press", sets: "3", reps: "10-15" },
          { name: "Leg Extensions", sets: "3", reps: "12-15" },
          { name: "Leg Curls", sets: "3", reps: "12-15" },
          { name: "Calf Raises", sets: "4", reps: "15-20" },
        ],
      },
      {
        name: "Upper Body B",
        focus: "Chest, Back, Shoulders, Arms",
        exercises: [
          { name: "Incline Bench Press", sets: "4", reps: "8-12" },
          { name: "Cable Rows", sets: "4", reps: "8-12" },
          { name: "Dumbbell Shoulder Press", sets: "3", reps: "8-12" },
          { name: "Pull-ups/Chin-ups", sets: "3", reps: "8-12" },
          { name: "Face Pulls", sets: "3", reps: "12-15" },
          { name: "Skull Crushers", sets: "3", reps: "12-15" },
          { name: "Hammer Curls", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Lower Body B",
        focus: "Quads, Hamstrings, Calves, Glutes",
        exercises: [
          { name: "Deadlifts", sets: "4", reps: "6-10" },
          { name: "Front Squats", sets: "3", reps: "8-12" },
          { name: "Lunges", sets: "3", reps: "10-12 per leg" },
          { name: "Hip Thrusts", sets: "3", reps: "10-15" },
          { name: "Seated Calf Raises", sets: "4", reps: "15-20" },
          { name: "Abdominal Work", sets: "3", reps: "15-20" },
        ],
      },
    ],
  },
  {
    name: "Full Body",
    description: "A balanced approach hitting all major muscle groups in each workout.",
    frequency: "3-4 days per week",
    suitable: "Beginners to intermediate",
    days: [
      {
        name: "Full Body A",
        focus: "All major muscle groups",
        exercises: [
          { name: "Squats", sets: "3-4", reps: "8-12" },
          { name: "Bench Press", sets: "3-4", reps: "8-12" },
          { name: "Barbell Rows", sets: "3", reps: "8-12" },
          { name: "Overhead Press", sets: "3", reps: "8-12" },
          { name: "Romanian Deadlifts", sets: "3", reps: "8-12" },
          { name: "Bicep Curls", sets: "3", reps: "12-15" },
          { name: "Tricep Extensions", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Full Body B",
        focus: "All major muscle groups",
        exercises: [
          { name: "Deadlifts", sets: "3-4", reps: "6-10" },
          { name: "Incline Bench Press", sets: "3", reps: "8-12" },
          { name: "Pull-ups/Lat Pulldowns", sets: "3", reps: "8-12" },
          { name: "Dumbbell Shoulder Press", sets: "3", reps: "8-12" },
          { name: "Leg Press", sets: "3", reps: "10-15" },
          { name: "Face Pulls", sets: "3", reps: "12-15" },
          { name: "Calf Raises", sets: "3", reps: "15-20" },
        ],
      },
      {
        name: "Full Body C",
        focus: "All major muscle groups",
        exercises: [
          { name: "Front Squats", sets: "3", reps: "8-12" },
          { name: "Dumbbell Bench Press", sets: "3", reps: "8-12" },
          { name: "Cable Rows", sets: "3", reps: "10-15" },
          { name: "Lateral Raises", sets: "3", reps: "12-15" },
          { name: "Lunges", sets: "3", reps: "10-12 per leg" },
          { name: "Hammer Curls", sets: "3", reps: "12-15" },
          { name: "Tricep Pushdowns", sets: "3", reps: "12-15" },
        ],
      },
    ],
  },
  {
    name: "Bro Split",
    description: "A 5-day split focusing on one major muscle group per day.",
    frequency: "5 days per week",
    suitable: "Intermediate to advanced",
    days: [
      {
        name: "Chest Day",
        focus: "Chest and some triceps",
        exercises: [
          { name: "Bench Press", sets: "4", reps: "8-12" },
          { name: "Incline Dumbbell Press", sets: "4", reps: "8-12" },
          { name: "Cable Flyes", sets: "3", reps: "12-15" },
          { name: "Decline Push-ups", sets: "3", reps: "12-15" },
          { name: "Dips", sets: "3", reps: "10-15" },
          { name: "Tricep Pushdowns", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Back Day",
        focus: "Back and some biceps",
        exercises: [
          { name: "Deadlifts", sets: "4", reps: "6-10" },
          { name: "Pull-ups/Lat Pulldowns", sets: "4", reps: "8-12" },
          { name: "Barbell Rows", sets: "3", reps: "8-12" },
          { name: "Seated Cable Rows", sets: "3", reps: "10-15" },
          { name: "Face Pulls", sets: "3", reps: "12-15" },
          { name: "Bicep Curls", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Leg Day",
        focus: "Quads, Hamstrings, Calves",
        exercises: [
          { name: "Squats", sets: "4", reps: "8-12" },
          { name: "Leg Press", sets: "4", reps: "10-15" },
          { name: "Romanian Deadlifts", sets: "3", reps: "8-12" },
          { name: "Leg Extensions", sets: "3", reps: "12-15" },
          { name: "Leg Curls", sets: "3", reps: "12-15" },
          { name: "Calf Raises", sets: "4", reps: "15-20" },
        ],
      },
      {
        name: "Shoulder Day",
        focus: "Shoulders and some triceps",
        exercises: [
          { name: "Overhead Press", sets: "4", reps: "8-12" },
          { name: "Lateral Raises", sets: "4", reps: "12-15" },
          { name: "Front Raises", sets: "3", reps: "12-15" },
          { name: "Reverse Flyes", sets: "3", reps: "12-15" },
          { name: "Shrugs", sets: "3", reps: "12-15" },
          { name: "Overhead Tricep Extensions", sets: "3", reps: "12-15" },
        ],
      },
      {
        name: "Arm Day",
        focus: "Biceps, Triceps, Forearms",
        exercises: [
          { name: "Barbell Curls", sets: "4", reps: "8-12" },
          { name: "Skull Crushers", sets: "4", reps: "8-12" },
          { name: "Hammer Curls", sets: "3", reps: "10-15" },
          { name: "Tricep Pushdowns", sets: "3", reps: "10-15" },
          { name: "Preacher Curls", sets: "3", reps: "12-15" },
          { name: "Dips", sets: "3", reps: "10-15" },
          { name: "Wrist Curls", sets: "3", reps: "15-20" },
        ],
      },
    ],
  },
]

// Sample chat messages for the AI assistant
const initialMessages = [
  {
    role: "assistant",
    content: "Hi there! I'm your fitness assistant. How can I help you with your workout or nutrition today?",
  },
]

interface AnatomyViewerProps {
  activeTab?: string
}

export default function AnatomyViewer({ activeTab }: AnatomyViewerProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [view, setView] = useState("front")
  const [selectedSplit, setSelectedSplit] = useState(0)
  const [selectedDay, setSelectedDay] = useState(0)
  const [metrics, setMetrics] = useState({
    height: 175, // cm
    weight: 70, // kg
    bodyFat: 15, // percentage
    age: 30,
    gender: "male",
    activityLevel: 1.55, // moderately active
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [inputMessage, setInputMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Calculate BMI
  const bmi = metrics.weight / Math.pow(metrics.height / 100, 2)

  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = () => {
    // BMR calculation using Mifflin-St Jeor Equation
    let bmr = 0
    if (metrics.gender === "male") {
      bmr = 10 * metrics.weight + 6.25 * metrics.height - 5 * metrics.age + 5
    } else {
      bmr = 10 * metrics.weight + 6.25 * metrics.height - 5 * metrics.age - 161
    }

    // TDEE = BMR * Activity Level
    return Math.round(bmr * metrics.activityLevel)
  }

  const tdee = calculateTDEE()

  // Calculate lean body mass
  const leanBodyMass = metrics.weight * (1 - metrics.bodyFat / 100)

  const handleMuscleClick = (muscle: string) => {
    setSelectedMuscle(muscle === selectedMuscle ? null : muscle)
  }

  const handleMetricChange = (metric: string, value: number) => {
    setMetrics((prev) => ({
      ...prev,
      [metric]: value,
    }))
  }

  const activityLevels = [
    { value: 1.2, label: "Sedentary" },
    { value: 1.375, label: "Lightly Active" },
    { value: 1.55, label: "Moderately Active" },
    { value: 1.725, label: "Very Active" },
    { value: 1.9, label: "Extremely Active" },
  ]

  // Filter muscle groups based on current view
  const filteredMuscleGroups = Object.entries(muscleGroups).filter(
    ([, muscle]) => muscle.position === "both" || muscle.position === view,
  )

  // Handle sending a chat message
  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: inputMessage }])

    // Simulate AI response (in a real app, this would call an AI API)
    setTimeout(() => {
      const responses = [
        "That's a great question about fitness! Based on your goals, I'd recommend focusing on progressive overload and proper nutrition.",
        "For your specific muscle group question, make sure you're training with proper form and adequate volume.",
        "Nutrition is key for your goals. Make sure you're getting enough protein (around 1.6-2.2g per kg of bodyweight) and staying in the right caloric range.",
        "Rest and recovery are just as important as the workout itself. Make sure you're getting 7-9 hours of sleep and allowing muscle groups to recover between sessions.",
        "For your workout split, consider your experience level and how many days per week you can train consistently.",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      setMessages((prev) => [...prev, { role: "assistant", content: randomResponse }])
    }, 1000)

    // Clear input
    setInputMessage("")
  }

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Custom component styles
  const cardStyle = {
    backgroundColor: styles.card,
    color: styles.cardForeground,
    borderRadius: styles.radius,
    border: `1px solid ${styles.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  }

  const tabsListStyle = {
    backgroundColor: styles.muted,
    borderRadius: styles.radius,
    padding: "0.25rem",
    display: "flex",
    gap: "0.5rem",
  }

  const tabTriggerStyle = {
    padding: "0.5rem 1rem",
    borderRadius: styles.radius,
    cursor: "pointer",
    fontWeight: 500,
  }

  const activeTabStyle = {
    backgroundColor: styles.primary,
    color: styles.primaryForeground,
  }

  const inputStyle = {
    backgroundColor: styles.background,
    color: styles.foreground,
    borderRadius: styles.radius,
    border: `1px solid ${styles.border}`,
    padding: "0.5rem",
    width: "100%",
  }

  const badgeStyle = {
    backgroundColor: "transparent",
    color: styles.foreground,
    borderRadius: "9999px",
    border: `1px solid ${styles.border}`,
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem",
    fontWeight: 500,
  }

  // If AI Chat tab is selected, show chat full screen and hide floating button
  if (activeTab === 'ai-chat') {
    return (
      <div className="fixed inset-0 top-16 h-[calc(100vh-4rem)] min-w-[40vw] max-w-full sm:w-[600px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 rounded-l-2xl animate-slide-in mx-auto left-0 right-0">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-[#de9151]/90 to-[#de9151]/60 rounded-tl-2xl">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow">
            <MessageSquare className="h-6 w-6 text-[#de9151]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#de9151]">Fitness Assistant</h3>
            <p className="text-xs text-gray-500">Ask about workouts, nutrition, etc.</p>
          </div>
        </div>
        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6]"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                  message.role === "user"
                    ? "bg-[#de9151] text-white rounded-br-md"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                }`}
                style={{
                  marginBottom: '0.25rem',
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Chat Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="px-6 py-4 border-t bg-white rounded-b-2xl"
        >
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 shadow-inner">
            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none outline-none resize-none h-10 text-sm"
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              type="submit"
              className="ml-2 bg-[#de9151] hover:bg-[#de9151]/90 text-white rounded-full p-2 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300`}>
        {/* Left panel - Metrics */}
        <div style={cardStyle} className="p-4 col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Body Metrics</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <label htmlFor="height">Height (cm)</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="height"
                  type="number"
                  value={metrics.height}
                  onChange={(e) => handleMetricChange("height", Number.parseFloat(e.target.value))}
                  style={{ ...inputStyle, width: "80px" }}
                />
                <Slider
                  value={[metrics.height]}
                  min={140}
                  max={220}
                  step={1}
                  onValueChange={(value) => handleMetricChange("height", value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                <label htmlFor="weight">Weight (kg)</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="weight"
                  type="number"
                  value={metrics.weight}
                  onChange={(e) => handleMetricChange("weight", Number.parseFloat(e.target.value))}
                  style={{ ...inputStyle, width: "80px" }}
                />
                <Slider
                  value={[metrics.weight]}
                  min={40}
                  max={150}
                  step={1}
                  onValueChange={(value) => handleMetricChange("weight", value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                <label htmlFor="bodyFat">Body Fat (%)</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="bodyFat"
                  type="number"
                  value={metrics.bodyFat}
                  onChange={(e) => handleMetricChange("bodyFat", Number.parseFloat(e.target.value))}
                  style={{ ...inputStyle, width: "80px" }}
                />
                <Slider
                  value={[metrics.bodyFat]}
                  min={5}
                  max={40}
                  step={0.5}
                  onValueChange={(value) => handleMetricChange("bodyFat", value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                value={metrics.age}
                onChange={(e) => handleMetricChange("age", Number.parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                style={inputStyle}
                value={metrics.gender}
                onChange={(e) => setMetrics((prev) => ({ ...prev, gender: e.target.value }))}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="activity">Activity Level</label>
              <select
                id="activity"
                style={inputStyle}
                value={metrics.activityLevel}
                onChange={(e) => setMetrics((prev) => ({ ...prev, activityLevel: Number.parseFloat(e.target.value) }))}
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-4 pt-4" style={{ borderTop: `1px solid ${styles.border}` }}>
            <div className="flex justify-between">
              <span className="font-medium">BMI:</span>
              <span
                style={{
                  fontWeight: "bold",
                  color: bmi < 18.5 ? "blue" : bmi < 25 ? "green" : bmi < 30 ? "orange" : "red",
                }}
              >
                {bmi.toFixed(1)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Lean Body Mass:</span>
              <span style={{ fontWeight: "bold" }}>{leanBodyMass.toFixed(1)} kg</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4" style={{ color: styles.primary }} />
                <span className="font-medium">TDEE:</span>
              </div>
              <span style={{ fontWeight: "bold" }}>{tdee} calories</span>
            </div>
          </div>
        </div>
        {/* Center panel - Muscle Group Viewer */}
        <div
          style={cardStyle}
          className="p-4 col-span-2 transition-all duration-300"
        >
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Muscle Groups</h2>
              <div style={tabsListStyle}>
                <button
                  style={{
                    ...tabTriggerStyle,
                    ...(view === "front" ? activeTabStyle : {}),
                  }}
                  onClick={() => setView("front")}
                >
                  Front View
                </button>
                <button
                  style={{
                    ...tabTriggerStyle,
                    ...(view === "back" ? activeTabStyle : {}),
                  }}
                  onClick={() => setView("back")}
                >
                  Back View
                </button>
              </div>
            </div>

            <div className="relative">
              <div className={view === "front" ? "block" : "hidden"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMuscleGroups.map(([id, muscle]) => (
                    <div
                      key={id}
                      style={{
                        ...cardStyle,
                        borderColor: muscle.color,
                        backgroundColor: selectedMuscle === id ? `${muscle.color}10` : styles.card,
                        boxShadow: selectedMuscle === id ? `0 0 0 2px ${muscle.color}` : cardStyle.boxShadow,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => handleMuscleClick(id)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "9999px",
                                backgroundColor: muscle.color,
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.25rem",
                              }}
                            >
                              <span>{muscle.icon}</span>
                            </div>
                            <h3 className="font-bold">{muscle.name}</h3>
                          </div>
                          <ChevronRight
                            className="h-5 w-5"
                            style={{
                              transform: selectedMuscle === id ? "rotate(90deg)" : "none",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </div>

                        {selectedMuscle === id && (
                          <div className="mt-2 space-y-3">
                            <p style={{ color: styles.mutedForeground, fontSize: "0.875rem" }}>{muscle.description}</p>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Dumbbell className="h-4 w-4" />
                                <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>Recommended exercises:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {muscle.exercises.map((exercise, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      ...badgeStyle,
                                      borderColor: muscle.color,
                                    }}
                                  >
                                    {exercise}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={view === "back" ? "block" : "hidden"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMuscleGroups.map(([id, muscle]) => (
                    <div
                      key={id}
                      style={{
                        ...cardStyle,
                        borderColor: muscle.color,
                        backgroundColor: selectedMuscle === id ? `${muscle.color}10` : styles.card,
                        boxShadow: selectedMuscle === id ? `0 0 0 2px ${muscle.color}` : cardStyle.boxShadow,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => handleMuscleClick(id)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "9999px",
                                backgroundColor: muscle.color,
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.25rem",
                              }}
                            >
                              <span>{muscle.icon}</span>
                            </div>
                            <h3 className="font-bold">{muscle.name}</h3>
                          </div>
                          <ChevronRight
                            className="h-5 w-5"
                            style={{
                              transform: selectedMuscle === id ? "rotate(90deg)" : "none",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </div>

                        {selectedMuscle === id && (
                          <div className="mt-2 space-y-3">
                            <p style={{ color: styles.mutedForeground, fontSize: "0.875rem" }}>{muscle.description}</p>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Dumbbell className="h-4 w-4" />
                                <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>Recommended exercises:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {muscle.exercises.map((exercise, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      ...badgeStyle,
                                      borderColor: muscle.color,
                                    }}
                                  >
                                    {exercise}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Chat Toggle Button */}
      <button
        className="fixed right-6 bottom-6 z-40 bg-[#de9151] text-white rounded-full p-4 shadow-lg hover:bg-[#de9151]/90 transition"
        style={{ top: 'auto', bottom: '1.5rem' }}
        onClick={() => setChatOpen(v => !v)}
        aria-label="Toggle chat"
      >
        {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
      {/* Workout Split Section */}
      <div className="mt-12 mb-20">
        <h2 className="text-2xl font-bold mb-6" style={{ color: styles.primary }}>
          Workout Splits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Split Selection */}
          <div className="col-span-1">
            <div style={cardStyle} className="p-4">
              <h3 className="text-lg font-semibold mb-4">Training Programs</h3>
              <div className="space-y-2">
                {workoutSplits.map((split, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "0.75rem",
                      borderRadius: styles.radius,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      backgroundColor: selectedSplit === index ? styles.primary : styles.muted,
                      color: selectedSplit === index ? styles.primaryForeground : styles.foreground,
                    }}
                    onClick={() => {
                      setSelectedSplit(index)
                      setSelectedDay(0)
                    }}
                  >
                    <div className="font-medium">{split.name}</div>
                    <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.9 }}>{split.frequency}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Split Details */}
          <div className="col-span-1 md:col-span-3">
            <div style={cardStyle} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{workoutSplits[selectedSplit].name}</h3>
                  <p style={{ color: styles.mutedForeground, marginTop: "0.25rem" }}>
                    {workoutSplits[selectedSplit].description}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    style={{
                      ...badgeStyle,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {workoutSplits[selectedSplit].frequency}
                  </span>
                  <span
                    style={{
                      ...badgeStyle,
                      backgroundColor: styles.muted,
                    }}
                  >
                    {workoutSplits[selectedSplit].suitable}
                  </span>
                </div>
              </div>

              {/* Day Selection Tabs */}
              <div className="mb-6">
                <div className="flex overflow-x-auto pb-2 gap-2">
                  {workoutSplits[selectedSplit].days.map((day, index) => (
                    <button
                      key={index}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: styles.radius,
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease",
                        backgroundColor: selectedDay === index ? styles.primary : styles.muted,
                        color: selectedDay === index ? styles.primaryForeground : styles.foreground,
                      }}
                      onClick={() => setSelectedDay(index)}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    style={{
                      backgroundColor: `${styles.primary}20`,
                      color: styles.primary,
                      borderRadius: "9999px",
                      padding: "0.5rem",
                    }}
                  >
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold">
                    Focus: {workoutSplits[selectedSplit].days[selectedDay].focus}
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                        <th className="text-left py-2 px-4">Exercise</th>
                        <th className="text-center py-2 px-4">Sets</th>
                        <th className="text-center py-2 px-4">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workoutSplits[selectedSplit].days[selectedDay].exercises.map((exercise, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: `1px solid ${styles.border}`,
                            transition: "background-color 0.2s ease",
                          }}
                          className="hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">{exercise.name}</td>
                          <td className="py-3 px-4 text-center">{exercise.sets}</td>
                          <td className="py-3 px-4 text-center">{exercise.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: `${styles.muted}80`,
                    border: `1px solid ${styles.border}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: styles.primary }} />
                    <div>
                      <h5 className="font-medium">Training Tips</h5>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "green" }} />
                          <span>
                            Rest 1-2 minutes between sets for smaller muscles, 2-3 minutes for compound movements.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "green" }} />
                          <span>Focus on progressive overload by increasing weight, reps, or sets over time.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "green" }} />
                          <span>
                            Maintain proper form throughout each exercise to maximize results and prevent injury.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
