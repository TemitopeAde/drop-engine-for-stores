import { extensions } from "@wix/astro/builders";

export default extensions.ecomValidations({
  id: "199f6dbe-6be5-4ce5-93d0-861daecd1709",
  name: "drop-validation",
  validateInCart: true,
  source:
    "./extensions/backend/service-plugins/drop-validation/drop-validation.ts",
});
