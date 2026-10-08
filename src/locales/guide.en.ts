// Long-form help content for the dashboard Guide & FAQ view.
export const guide = {
  steps: [
    {
      icon: "create",
      title: "Create a drop",
      body: "Select Create drop, give it a name, and choose the Wix Stores products that belong to the launch. You can select up to 10,000 products, or use Select all products to include the whole catalog.",
    },
    {
      icon: "schedule",
      title: "Set the launch window",
      body: "Pick a start and an end time and the time zone they should be read in. Use Now to start immediately. The end must be after the start, and times that fall inside a daylight-saving gap or overlap must be changed.",
    },
    {
      icon: "after",
      title: "Choose what happens afterwards",
      body: "Restore normal purchasing reopens checkout when the drop ends. Keep purchasing blocked keeps the products unpurchasable until you cancel the drop.",
    },
    {
      icon: "publish",
      title: "Save or publish",
      body: "Save draft keeps your work without affecting the store. Publish drop activates the schedule: the drop shows as Scheduled, then Live, then Ended.",
    },
    {
      icon: "storefront",
      title: "Show the countdown on your site",
      body: "The Drop countdown plugin is added to your Wix Stores product page automatically and shows the launch status for that product. You can also add the Drop launch countdown element anywhere in the Editor and set its product ID.",
    },
  ],
  lifecycle: [
    {
      status: "DRAFT",
      checkout: "open",
      body: "Saved but not published. Checkout is not affected.",
    },
    {
      status: "SCHEDULED",
      checkout: "locked",
      body: "Published and waiting to open. Checkout is blocked.",
    },
    {
      status: "LIVE",
      checkout: "open",
      body: "Inside the launch window. Customers can buy.",
    },
    {
      status: "ENDED",
      checkout: "depends",
      body: "The window has closed. Checkout follows the after-drop setting.",
    },
  ],
  sidePaths: [
    {
      status: "CANCELLED",
      checkout: "open",
      body: "Stopped by you. Normal purchasing is restored.",
    },
    {
      status: "ARCHIVED",
      checkout: "open",
      body: "Hidden from active work. Restore it to edit it again.",
    },
  ],
  checkout: {
    open: "Checkout open",
    locked: "Checkout blocked",
    depends: "Your choice",
  },
  actions: [
    {
      icon: "edit",
      title: "Edit",
      body: "Change the name, products, schedule, or after-drop behavior.",
    },
    {
      icon: "duplicate",
      title: "Duplicate",
      body: "Copy the drop as a new draft for your next launch.",
    },
    {
      icon: "cancel",
      title: "Cancel drop",
      body: "Stop a published drop and reopen checkout right away.",
    },
    {
      icon: "archive",
      title: "Archive",
      body: "Put away a draft, ended, or cancelled drop.",
    },
    {
      icon: "restore",
      title: "Restore draft",
      body: "Bring an archived drop back as a draft.",
    },
  ],
  faqCategories: {
    launching: "Launching",
    checkout: "Checkout",
    managing: "Managing drops",
    storefront: "Storefront",
  },
  faq: [
    {
      category: "checkout",
      q: "Do customers still see the products before the drop opens?",
      a: "Yes. Products stay visible on your store so customers can browse them and see the countdown. Only checkout is blocked until the drop opens.",
    },
    {
      category: "checkout",
      q: "What happens if someone adds a product to the cart early?",
      a: "They can add it to the cart, but checkout shows the message “This product is not available for purchase until the drop opens.” and won't let them complete the order until the launch window starts.",
    },
    {
      category: "launching",
      q: "Whose clock decides when the drop opens?",
      a: "The server's clock. Changing the time on a customer's device does not open a drop early. The countdown on your site checks with the server every 15 seconds.",
    },
    {
      category: "launching",
      q: "Which time zone should I use?",
      a: "Use the time zone you announce the launch in. The start and end are stored as exact moments, so customers anywhere open the drop at the same instant.",
    },
    {
      category: "managing",
      q: "How many drops can I run at once?",
      a: "The Free plan includes one active drop: a published drop that is scheduled, live, or ended with purchasing kept blocked. You can keep as many drafts as you like. Cancel the current drop before publishing another.",
    },
    {
      category: "managing",
      q: "How do I stop a drop immediately?",
      a: "Open the actions menu (⋯) next to the drop and choose Cancel drop. Normal purchasing is restored straight away.",
    },
    {
      category: "managing",
      q: "Can I edit a drop after publishing it?",
      a: "Yes. Open the drop, make your changes, and save. A published drop stays published. If someone else changed it in another session, reload the page before saving.",
    },
    {
      category: "managing",
      q: "Why can't I archive a drop?",
      a: "Published drops still control checkout, so they can't be archived. Cancel the drop first, then archive it.",
    },
    {
      category: "launching",
      q: "Why won't my drop publish?",
      a: "Check that the end time is in the future and after the start, that at least one product is selected, and that no other drop is active.",
    },
    {
      category: "storefront",
      q: "The countdown isn't showing on my product page. What should I check?",
      a: "Make sure the drop is published and includes that product. If you added the Drop launch countdown element in the Editor, confirm its product ID matches a product in the drop.",
    },
    {
      category: "checkout",
      q: "What happens if launch availability can't be checked?",
      a: "Checkout is paused with the message “Launch availability cannot be verified. Please try again shortly.” This prevents early or late sales during a brief outage. It clears on its own once the service responds again.",
    },
    {
      category: "managing",
      q: "Can I reuse a drop for the next launch?",
      a: "Yes. Choose Duplicate from the actions menu to copy the products and settings into a new draft, then set new dates.",
    },
  ],
} as const;
export type FaqCategory = keyof typeof guide.faqCategories;
