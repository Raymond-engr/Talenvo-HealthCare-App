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
    answer: "Yes, you can easily book appointments with any available healthcare provider through our platform."
  },
  {
    question: "Is there a fee for using this platform?",
    answer: "Our platform is free to use. You only pay for the medical services you receive."
  },
  {
    question: "Can I cancel or reschedule an appointment?",
    answer: "Yes, you can cancel or reschedule appointments through your dashboard up to 24 hours before the scheduled time."
  },
  {
    question: "How do I know if a hospital or doctor accepts my insurance?",
    answer: "You can check insurance acceptance information on each provider's profile page."
  }
]

export function FAQSection() {
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}