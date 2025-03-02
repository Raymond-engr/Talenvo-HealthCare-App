'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Can I book an appointment through the platform?",
    answer: "Yes, you can book appointments directly from the provider's profile page. Choose a time that works for you, and you'll receive a confirmation and reminder."
  },
  {
    question: "Is there a fee for using this platform?",
    answer: "No, our platform is completely free to use. You only pay for the medical services you receive."
  },
  {
    question: "Can I cancel or reschedule an appointment?",
    answer: "Yes, you can cancel or reschedule appointments through your dashboard up to 24 hours before the scheduled time."
  },
  {
    question: "What if I need directions to the hospital or clinic?",
    answer: "Every provider profile includes directions and a map for easy navigation to their location."
  },
  {
    question: "How do I know if a hospital or doctor accepts my insurance?",
    answer: "You can check insurance acceptance information on each provider's profile page."
  }
]

export function FAQSection() {
  return (
    <div className="w-full container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <div className="max-w-3xl">
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}