export const storePolicies = {
  privacy: {
    title: "Privacy policy.",
    intro: "This notice explains how Optimax Resources handles personal information when you browse the store, create an account, place an order or contact our team.",
    updated: "19 November 2026",
    sections: [
      ["Information you provide", "We process the name, email address and phone number you provide, your saved delivery addresses, account profile and optional profile photo. Orders contain purchased items, quantities, delivery details, status updates and payment references. We also process messages you send to the team and product reviews you choose to submit. You can browse the public store without creating an account; account and delivery details are needed for account features and orders."],
      ["Why we use your information", "We use this information to manage sign-in, fulfil and support orders, arrange delivery, verify payments, issue invoices, respond to enquiries and maintain account features such as saved products and order history. Processing supports your requested services and purchase arrangements, our legitimate interests in operating and protecting the store, and applicable recordkeeping obligations. Where we ask for consent for an optional use, you may withdraw that consent without affecting earlier lawful processing."],
      ["Payments through Paystack", "Online checkout is handled by Paystack on its checkout service. Optimax receives transaction references, amounts, currency and payment status so an order can be reconciled. This store does not collect full card numbers, card security codes or card PINs in its own forms or database. Paystack handles the payment details you provide on its service under its own privacy terms."],
      ["Browser storage and account preferences", "The store uses browser storage to maintain your signed-in session and shopping features, including your bag, wishlist, recently viewed products and display theme. A profile photo selected during sign-up may be temporarily kept in this browser until your account can upload it. Clearing browser data can remove local preferences, pending photo selections and unsynchronised shopping information, and may sign you out. Account records already saved on the server are not deleted by clearing browser storage."],
      ["Who receives information", "Supabase provides the store’s authentication, database and file storage. Vercel hosts the website, and Paystack processes online payments. Authorised store administrators can access information needed to manage customers and orders. Delivery partners receive the recipient, contact and address information needed to deliver an order. Hosting and infrastructure providers may process technical details such as IP addresses, device or browser information and service logs for operation and security. Providers may process information outside Nigeria; contact us for details about the arrangements that apply to your information."],
      ["Photos, reviews and external services", "Profile photos are stored in a publicly readable image bucket; anyone with a photo’s direct URL may be able to view it. Upload a photo you are comfortable displaying and avoid identity documents or other sensitive material. Reviews submitted for publication may be shown on product pages. Clicking a WhatsApp link opens a separate service, and messages sent there are handled by that service and the Optimax team. External services have their own privacy notices."],
      ["Retention and security", "Information is retained for the time needed to operate your account, fulfil orders, handle enquiries or disputes, and meet applicable financial and legal recordkeeping requirements. Order and invoice records may need to remain after a profile is updated or an account deletion is requested. The store uses authenticated access and database access controls for account and order records. No online service can guarantee absolute security; protect your sign-in details and tell the team about suspected unauthorised access."],
      ["Your choices and privacy rights", "You can update available profile fields and saved addresses in your account. You may also request access to or a copy of your information, correction, deletion, restriction, portability, or object to certain processing where applicable. You may withdraw consent where processing relies on it. Requests are assessed under applicable data protection law, and limited identity verification may be needed to protect your account. Some information may be retained where a lawful obligation or another permitted reason applies. You may raise a complaint with the Nigeria Data Protection Commission."],
      ["Privacy requests and updates", "Use the contact options below to send a privacy request or ask how your information is handled. Describe the request and identify the account or order concerned where relevant; do not send passwords, payment PINs or full card details. If this notice changes, the updated version and revision date will appear on this page."],
    ],
    related: "/return-policy",
    relatedLabel: "Read the return policy",
  },
  returns: {
    title: "Return policy.",
    intro: "Need help with an item you received? Contact the Optimax team so we can review your order and explain the next steps.",
    sections: [
      ["Start with your order reference", "Contact us with your order reference, the product name and a description of the issue. Include clear photos where helpful. You can find your reference and purchase details under Your orders."],
      ["Damaged, faulty or incorrect items", "Let the team know as soon as you notice a problem. Keep the item, its accessories and packaging available for review. If installation or setup may be involved, explain what happened so the team can advise on the appropriate next step."],
      ["Arrange a return with the team", "Contact Optimax before sending an item back so the team can confirm the return arrangements and destination. Ask the team to confirm the applicable return window, eligibility and any transport costs for your particular item before purchasing or arranging a return."],
      ["Refunds and replacements", "The team will review the reported issue and explain the available resolution, which may include troubleshooting, a replacement or a refund where applicable. Confirm any collection arrangements, refund method and processing estimate directly with the team. A submitted enquiry does not itself confirm that a refund has been issued."],
    ],
    related: "/shipping-policy",
    relatedLabel: "Read the shipping policy",
  },
  shipping: {
    title: "Shipping policy.",
    intro: "Delivery is arranged directly with the Optimax team. Your online product payment covers the product total; delivery charges are confirmed separately.",
    sections: [
      ["Delivery coverage and charges", "Contact the team with your location to confirm whether delivery is available, the delivery charge and any collection options. Charges depend on the destination and the order. Do not assume delivery is included in the product price."],
      ["Preparing your order", "Provide a complete delivery address, recipient name and a reachable phone number. The team confirms product availability, payment status and delivery arrangements before dispatch. If your details need to change, contact us promptly with your order reference."],
      ["Delivery estimates and tracking", "The team will confirm an estimated dispatch and delivery timeframe for your order. Estimates may change because of stock availability, courier schedules or access to your location. View delivery updates under Your orders or Track an order; tracking details appear when supplied by the store."],
      ["Receiving your delivery", "Check the package and items when they arrive. If something is damaged, missing or incorrect, keep the packaging and contact the team with your order reference and supporting photos where available. For a missed delivery or an address problem, contact us to confirm the next delivery arrangement and any additional charge before it is scheduled."],
    ],
    related: "/return-policy",
    relatedLabel: "Read the return policy",
  },
};
