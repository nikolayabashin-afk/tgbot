export type Lang = "ru" | "en";

export type Product = {
  id: string;
  category: string;
  ruName: string;
  enName: string;
  ruDesc: string;
  enDesc: string;
  maker: string;
  specs: string[];
};

export const products: Product[] = [
  {
    id: "ct-64",
    category: "КТ / CT",
    ruName: "Компьютерный томограф 64 среза",
    enName: "64-slice CT scanner",
    ruDesc: "Практичное решение для диагностических отделений с высокой пропускной способностью.",
    enDesc: "A practical solution for diagnostic departments with high patient throughput.",
    maker: "GE / Siemens / Canon",
    specs: ["64 slices", "DICOM / PACS", "installation planning"],
  },
  {
    id: "mri-15t",
    category: "МРТ / MRI",
    ruName: "МРТ 1.5Т для клиник",
    enName: "1.5T MRI for clinics",
    ruDesc: "Подбор конфигурации, проверка помещения, сопровождение доставки и монтажа.",
    enDesc: "Configuration selection, room readiness checks, delivery and installation support.",
    maker: "Siemens / Philips / GE",
    specs: ["1.5T", "RF shielding", "cooling requirements"],
  },
  {
    id: "xray-mobile",
    category: "Рентген / X-ray",
    ruName: "Мобильная рентген-система",
    enName: "Mobile X-ray system",
    ruDesc: "Оборудование для палат, приемных отделений и операционных блоков.",
    enDesc: "Equipment for wards, emergency departments and operating rooms.",
    maker: "Carestream / Siemens / DRGEM",
    specs: ["portable", "digital detector", "fast deployment"],
  },
  {
    id: "angiography",
    category: "Ангиограф / Angio",
    ruName: "Ангиографическая система",
    enName: "Angiography system",
    ruDesc: "Проектирование инфраструктуры, требования к помещению и пусконаладка.",
    enDesc: "Infrastructure planning, room requirements and commissioning coordination.",
    maker: "Philips / Siemens / Canon",
    specs: ["C-arm", "hybrid OR", "high load floor"],
  },
];

export function getProduct(productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function productName(product: Product, lang: Lang): string {
  return lang === "ru" ? product.ruName : product.enName;
}

export function productDescription(product: Product, lang: Lang): string {
  return lang === "ru" ? product.ruDesc : product.enDesc;
}
