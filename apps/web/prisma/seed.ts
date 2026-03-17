import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.owner.upsert({
    where: { email: "sachidanandsabrwal@gmail.com" },
    update: {},
    create: {
      email: "sachidanandsabrwal@gmail.com",
      passwordHash,
      name: "Sachidanand Sabrwal",
      phone: "+919876543210",
      isVerified: true,
    },
  });

  const canteen = await prisma.canteen.upsert({
    where: { slug: "sachis-kitchen" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Sachi's Kitchen",
      slug: "sachis-kitchen",
      isActive: true,
      openingTime: "08:00",
      closingTime: "22:00",
      avgPrepTime: 15,
    },
  });

  const beverages = await prisma.category.upsert({
    where: { id: "cat-beverages-sachis" },
    update: {},
    create: {
      id: "cat-beverages-sachis",
      canteenId: canteen.id,
      name: "Beverages",
      sortOrder: 1,
      isActive: true,
    },
  });

  const snacks = await prisma.category.upsert({
    where: { id: "cat-snacks-sachis" },
    update: {},
    create: {
      id: "cat-snacks-sachis",
      canteenId: canteen.id,
      name: "Snacks",
      sortOrder: 2,
      isActive: true,
    },
  });

  const mainCourse = await prisma.category.upsert({
    where: { id: "cat-maincourse-sachis" },
    update: {},
    create: {
      id: "cat-maincourse-sachis",
      canteenId: canteen.id,
      name: "Main Course",
      sortOrder: 3,
      isActive: true,
    },
  });

  const desserts = await prisma.category.upsert({
    where: { id: "cat-desserts-sachis" },
    update: {},
    create: {
      id: "cat-desserts-sachis",
      canteenId: canteen.id,
      name: "Desserts",
      sortOrder: 4,
      isActive: true,
    },
  });

  const combos = await prisma.category.upsert({
    where: { id: "cat-combos-sachis" },
    update: {},
    create: {
      id: "cat-combos-sachis",
      canteenId: canteen.id,
      name: "Combos & Thalis",
      sortOrder: 5,
      isActive: true,
    },
  });

  const breads = await prisma.category.upsert({
    where: { id: "cat-breads-sachis" },
    update: {},
    create: {
      id: "cat-breads-sachis",
      canteenId: canteen.id,
      name: "Breads",
      sortOrder: 6,
      isActive: true,
    },
  });

  const menuItems = [
    { id: "mi-masala-chai", categoryId: beverages.id, name: "Masala Chai", description: "Aromatic Indian tea brewed with fresh spices and milk", price: 20, isVeg: true, isAvailable: true, sortOrder: 1 },
    { id: "mi-cold-coffee", categoryId: beverages.id, name: "Cold Coffee", description: "Chilled blended coffee with milk and a hint of chocolate", price: 60, isVeg: true, isAvailable: true, sortOrder: 2 },
    { id: "mi-fresh-lime-soda", categoryId: beverages.id, name: "Fresh Lime Soda", description: "Freshly squeezed lime with soda, sweet or salty", price: 40, isVeg: true, isAvailable: true, sortOrder: 3 },
    { id: "mi-hot-coffee", categoryId: beverages.id, name: "Hot Coffee", description: "Strong filter coffee with steamed milk", price: 30, isVeg: true, isAvailable: true, sortOrder: 4 },
    { id: "mi-mango-lassi", categoryId: beverages.id, name: "Mango Lassi", description: "Thick yogurt smoothie blended with fresh mango pulp", price: 50, isVeg: true, isAvailable: true, sortOrder: 5 },
    { id: "mi-buttermilk", categoryId: beverages.id, name: "Masala Chaas", description: "Spiced buttermilk with cumin and fresh coriander", price: 25, isVeg: true, isAvailable: true, sortOrder: 6 },
    { id: "mi-oreo-shake", categoryId: beverages.id, name: "Oreo Milkshake", description: "Creamy milkshake blended with crushed Oreo cookies", price: 80, isVeg: true, isAvailable: true, sortOrder: 7 },

    { id: "mi-samosa", categoryId: snacks.id, name: "Samosa", description: "Crispy pastry filled with spiced potato and peas", price: 15, isVeg: true, isAvailable: true, sortOrder: 1 },
    { id: "mi-vada-pav", categoryId: snacks.id, name: "Vada Pav", description: "Mumbai-style spiced potato fritter in a soft bun with chutneys", price: 25, isVeg: true, isAvailable: true, sortOrder: 2 },
    { id: "mi-chicken-sandwich", categoryId: snacks.id, name: "Chicken Sandwich", description: "Grilled chicken with lettuce, mayo, and cheese in toasted bread", price: 80, isVeg: false, isAvailable: true, sortOrder: 3 },
    { id: "mi-paneer-roll", categoryId: snacks.id, name: "Paneer Tikka Roll", description: "Marinated paneer wrapped in a soft paratha with onions and chutney", price: 70, isVeg: true, isAvailable: true, sortOrder: 4 },
    { id: "mi-chicken-roll", categoryId: snacks.id, name: "Chicken Tikka Roll", description: "Juicy chicken tikka wrapped in paratha with mint chutney", price: 90, isVeg: false, isAvailable: true, sortOrder: 5 },
    { id: "mi-aloo-tikki", categoryId: snacks.id, name: "Aloo Tikki", description: "Crispy spiced potato patties served with tamarind and green chutney", price: 30, isVeg: true, isAvailable: true, sortOrder: 6 },
    { id: "mi-spring-roll", categoryId: snacks.id, name: "Veg Spring Roll", description: "Crispy rolls stuffed with stir-fried vegetables", price: 50, isVeg: true, isAvailable: true, sortOrder: 7 },
    { id: "mi-french-fries", categoryId: snacks.id, name: "French Fries", description: "Golden crispy fries seasoned with peri-peri spice", price: 60, isVeg: true, isAvailable: true, sortOrder: 8 },
    { id: "mi-cheese-maggi", categoryId: snacks.id, name: "Cheese Maggi", description: "Classic Maggi noodles loaded with melted cheese", price: 50, isVeg: true, isAvailable: true, sortOrder: 9 },
    { id: "mi-bread-pakora", categoryId: snacks.id, name: "Bread Pakora", description: "Potato-stuffed bread slices deep fried in gram flour batter", price: 20, isVeg: true, isAvailable: true, sortOrder: 10 },

    { id: "mi-paneer-butter-masala", categoryId: mainCourse.id, name: "Paneer Butter Masala", description: "Soft paneer cubes in a rich, creamy tomato gravy", price: 150, isVeg: true, isAvailable: true, sortOrder: 1 },
    { id: "mi-chicken-biryani", categoryId: mainCourse.id, name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken and herbs", price: 180, isVeg: false, isAvailable: true, sortOrder: 2 },
    { id: "mi-dal-tadka-rice", categoryId: mainCourse.id, name: "Dal Tadka with Rice", description: "Yellow lentils tempered with cumin and garlic, served with steamed rice", price: 120, isVeg: true, isAvailable: true, sortOrder: 3 },
    { id: "mi-chole-bhature", categoryId: mainCourse.id, name: "Chole Bhature", description: "Spicy chickpea curry with fluffy deep-fried bread", price: 100, isVeg: true, isAvailable: true, sortOrder: 4 },
    { id: "mi-rajma-chawal", categoryId: mainCourse.id, name: "Rajma Chawal", description: "Kidney bean curry in thick gravy served with steamed rice", price: 110, isVeg: true, isAvailable: true, sortOrder: 5 },
    { id: "mi-egg-curry-rice", categoryId: mainCourse.id, name: "Egg Curry with Rice", description: "Boiled eggs in a spiced onion-tomato gravy with rice", price: 100, isVeg: false, isAvailable: true, sortOrder: 6 },
    { id: "mi-veg-biryani", categoryId: mainCourse.id, name: "Veg Biryani", description: "Aromatic basmati rice cooked with mixed vegetables and spices", price: 130, isVeg: true, isAvailable: true, sortOrder: 7 },
    { id: "mi-kadai-paneer", categoryId: mainCourse.id, name: "Kadai Paneer", description: "Paneer cooked with bell peppers in a spicy kadai masala", price: 160, isVeg: true, isAvailable: true, sortOrder: 8 },
    { id: "mi-butter-chicken", categoryId: mainCourse.id, name: "Butter Chicken", description: "Tender chicken in a smooth, buttery tomato-cream sauce", price: 200, isVeg: false, isAvailable: true, sortOrder: 9 },
    { id: "mi-egg-biryani", categoryId: mainCourse.id, name: "Egg Biryani", description: "Basmati rice layered with spiced boiled eggs and aromatics", price: 140, isVeg: false, isAvailable: true, sortOrder: 10 },

    { id: "mi-gulab-jamun", categoryId: desserts.id, name: "Gulab Jamun (2 pcs)", description: "Soft milk-solid dumplings soaked in rose-flavored sugar syrup", price: 40, isVeg: true, isAvailable: true, sortOrder: 1 },
    { id: "mi-rasmalai", categoryId: desserts.id, name: "Rasmalai (2 pcs)", description: "Soft cottage cheese discs in chilled saffron milk", price: 60, isVeg: true, isAvailable: true, sortOrder: 2 },
    { id: "mi-brownie", categoryId: desserts.id, name: "Chocolate Brownie", description: "Warm fudgy brownie with a gooey center", price: 70, isVeg: true, isAvailable: true, sortOrder: 3 },
    { id: "mi-kulfi", categoryId: desserts.id, name: "Malai Kulfi", description: "Traditional Indian ice cream with pistachios and cardamom", price: 50, isVeg: true, isAvailable: true, sortOrder: 4 },
    { id: "mi-kheer", categoryId: desserts.id, name: "Rice Kheer", description: "Creamy rice pudding slow-cooked with milk, sugar, and nuts", price: 45, isVeg: true, isAvailable: true, sortOrder: 5 },

    { id: "mi-veg-thali", categoryId: combos.id, name: "Veg Thali", description: "Dal, paneer sabzi, rice, 2 rotis, raita, salad, and pickle", price: 180, isVeg: true, isAvailable: true, sortOrder: 1 },
    { id: "mi-non-veg-thali", categoryId: combos.id, name: "Non-Veg Thali", description: "Chicken curry, dal, rice, 2 rotis, raita, salad, and pickle", price: 220, isVeg: false, isAvailable: true, sortOrder: 2 },
    { id: "mi-biryani-combo", categoryId: combos.id, name: "Biryani Combo", description: "Chicken biryani with raita, salad, and a cold drink", price: 230, isVeg: false, isAvailable: true, sortOrder: 3 },
    { id: "mi-snack-combo", categoryId: combos.id, name: "Snack Combo", description: "2 samosas + masala chai + aloo tikki", price: 55, isVeg: true, isAvailable: true, sortOrder: 4 },
    { id: "mi-breakfast-combo", categoryId: combos.id, name: "Breakfast Combo", description: "Chole bhature with lassi and pickle", price: 130, isVeg: true, isAvailable: true, sortOrder: 5 },

    { id: "mi-butter-roti", categoryId: breads.id, name: "Butter Roti", description: "Soft whole wheat flatbread brushed with butter", price: 15, isVeg: true, isAvailable: true, sortOrder: 1 },
    { id: "mi-tandoori-roti", categoryId: breads.id, name: "Tandoori Roti", description: "Clay oven-baked whole wheat bread", price: 20, isVeg: true, isAvailable: true, sortOrder: 2 },
    { id: "mi-garlic-naan", categoryId: breads.id, name: "Garlic Naan", description: "Soft naan topped with garlic and butter from the tandoor", price: 35, isVeg: true, isAvailable: true, sortOrder: 3 },
    { id: "mi-butter-naan", categoryId: breads.id, name: "Butter Naan", description: "Fluffy naan bread brushed with melted butter", price: 30, isVeg: true, isAvailable: true, sortOrder: 4 },
    { id: "mi-laccha-paratha", categoryId: breads.id, name: "Laccha Paratha", description: "Layered flaky flatbread cooked with ghee", price: 30, isVeg: true, isAvailable: true, sortOrder: 5 },
    { id: "mi-aloo-paratha", categoryId: breads.id, name: "Aloo Paratha", description: "Stuffed wheat bread with spiced potato filling, served with curd", price: 45, isVeg: true, isAvailable: true, sortOrder: 6 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  const tables = [
    { id: "tbl-sachis-1", label: "Table 1", qrToken: "qr-sachis-kitchen-t1-a1b2c3d4" },
    { id: "tbl-sachis-2", label: "Table 2", qrToken: "qr-sachis-kitchen-t2-e5f6g7h8" },
    { id: "tbl-sachis-3", label: "Table 3", qrToken: "qr-sachis-kitchen-t3-i9j0k1l2" },
    { id: "tbl-sachis-4", label: "Table 4", qrToken: "qr-sachis-kitchen-t4-m3n4o5p6" },
    { id: "tbl-sachis-5", label: "Table 5", qrToken: "qr-sachis-kitchen-t5-q7r8s9t0" },
    { id: "tbl-sachis-6", label: "Table 6", qrToken: "qr-sachis-kitchen-t6-u1v2w3x4" },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: { id: table.id },
      update: {},
      create: {
        id: table.id,
        canteenId: canteen.id,
        label: table.label,
        qrToken: table.qrToken,
        isActive: true,
        section: "Ground Floor",
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Owner: ${owner.email} (id: ${owner.id})`);
  console.log(`Canteen: ${canteen.name} (id: ${canteen.id})`);
  console.log(`Categories: 6 created`);
  console.log(`Menu items: ${menuItems.length} created`);
  console.log(`Tables: 6 created (Ground Floor)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
