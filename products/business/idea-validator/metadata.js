import productConfig from "./product.config.js";

export const metadata = {
  title: productConfig.title,
  shortDescription: productConfig.shortDescription,
  longDescription: productConfig.longDescription,
  icon: productConfig.icon,
  estimatedCompletionTime: productConfig.estimatedCompletionTime,
  featured: productConfig.featured,
  availability: productConfig.availability,
};

export default metadata;

