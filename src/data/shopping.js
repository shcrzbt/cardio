export const shoppingList = [
  {
    category: 'Мясо, рыба, яйца',
    icon: '🥩',
    items: [
      { id: 'meat1', name: 'Куриная грудка', amount: '1.2 кг', note: 'Пн, Вт, Чт, Пт, Сб, Вс' },
      { id: 'meat2', name: 'Говядина (тушить)', amount: '600 г', note: 'Вт, Пт, Вс' },
      { id: 'meat3', name: 'Индейка (запечь)', amount: '200 г', note: 'Ср' },
      { id: 'meat4', name: 'Рыба (треска/хек/минтай)', amount: '700 г', note: 'Пн, Ср, Чт — на пару' },
      { id: 'meat5', name: 'Лосось или треска (запечь)', amount: '200 г', note: 'Сб' },
      { id: 'meat6', name: 'Яйца', amount: '12 шт', note: 'Пн омлет, Ср, Пт, Вс, Сб сырники' },
    ],
  },
  {
    category: 'Молочные и кисломолочные',
    icon: '🥛',
    items: [
      { id: 'dairy1', name: 'Творог 5%', amount: '600 г', note: 'Вт, Пт, Сб сырники' },
      { id: 'dairy2', name: 'Кефир 1%', amount: '1.5 л', note: 'Ужин каждый день' },
      { id: 'dairy3', name: 'Сметана 10%', amount: '100 г', note: 'Сб к сырникам' },
      { id: 'dairy4', name: 'Масло сливочное', amount: '100 г', note: 'Ср в гречку' },
    ],
  },
  {
    category: 'Крупы и хлеб',
    icon: '🌾',
    items: [
      { id: 'grain1', name: 'Гречка', amount: '800 г', note: 'Пн, Ср, Пт, Вс' },
      { id: 'grain2', name: 'Овсяные хлопья', amount: '500 г', note: 'Пн, Чт' },
      { id: 'grain3', name: 'Рис бурый', amount: '300 г', note: 'Вт, Сб' },
      { id: 'grain4', name: 'Перловка', amount: '200 г', note: 'Ср (альтернатива гречке)' },
      { id: 'grain5', name: 'Цельнозерновой хлеб', amount: '1 буханка', note: 'Вт, Ср, Чт, Пт' },
    ],
  },
  {
    category: 'Овощи',
    icon: '🥦',
    items: [
      { id: 'veg1', name: 'Морковь', amount: '1 кг', note: 'Супы, салаты, тушёные блюда' },
      { id: 'veg2', name: 'Свёкла', amount: '500 г', note: 'Борщ, свекольный салат' },
      { id: 'veg3', name: 'Капуста белокочанная', amount: '700 г', note: 'Вт, Чт борщ, тушёная' },
      { id: 'veg4', name: 'Кабачок / цукини', amount: '3 шт', note: 'Пн, Ср, Чт — тушёные' },
      { id: 'veg5', name: 'Брокколи', amount: '300 г', note: 'Пн ужин' },
      { id: 'veg6', name: 'Помидоры', amount: '8 шт', note: 'Салаты, Пт яичница' },
      { id: 'veg7', name: 'Огурцы', amount: '8 шт', note: 'Салаты' },
      { id: 'veg8', name: 'Болгарский перец', amount: '3 шт', note: 'Чт, Ср овощи гриль' },
      { id: 'veg9', name: 'Лук репчатый', amount: '500 г', note: 'Супы, тушёные блюда' },
      { id: 'veg10', name: 'Картофель', amount: '400 г', note: 'Вт 100г, Сб 150г' },
      { id: 'veg11', name: 'Тыква', amount: '300 г', note: 'Желчегонная, супы/гарнир' },
      { id: 'veg12', name: 'Зелень (петрушка, укроп)', amount: '2 пучка', note: 'Украшение, салаты' },
    ],
  },
  {
    category: 'Фрукты и ягоды',
    icon: '🍎',
    items: [
      { id: 'fruit1', name: 'Ягоды (свежие/замороженные)', amount: '200 г', note: 'Пн завтрак' },
      { id: 'fruit2', name: 'Яблоки или груши', amount: '3 шт', note: 'Чт завтрак' },
      { id: 'fruit3', name: 'Бананы', amount: '2 шт', note: 'Чт завтрак' },
    ],
  },
  {
    category: 'Масла и приправы',
    icon: '🫙',
    items: [
      { id: 'oil1', name: 'Льняное масло', amount: '250 мл', note: 'Вт, Чт завтрак — 1 ст.л. утром' },
      { id: 'oil2', name: 'Оливковое масло', amount: '250 мл', note: 'Салаты, Ср ужин' },
      { id: 'oil3', name: 'Куркума', amount: '1 пачка', note: 'Желчегонная специя' },
      { id: 'oil4', name: 'Имбирь (свежий или молотый)', amount: '50 г', note: 'Желчегонный' },
    ],
  },
  {
    category: 'Напитки и травы',
    icon: '🍵',
    items: [
      { id: 'drink1', name: 'Шиповник сушёный', amount: '100 г', note: 'Ср, Вс настой' },
      { id: 'drink2', name: 'Зелёный чай', amount: '1 пачка', note: 'Вт, Пт завтрак' },
      { id: 'drink3', name: 'Мята сушёная', amount: '1 пачка', note: 'Чт чай с мятой' },
      { id: 'drink4', name: 'Цикорий растворимый', amount: '1 банка', note: 'Желчегонный, замена кофе' },
    ],
  },
  {
    category: 'Орехи',
    icon: '🥜',
    items: [
      { id: 'nuts1', name: 'Грецкие орехи или миндаль', amount: '150 г', note: 'Пт ужин 15г + запас' },
    ],
  },
]
