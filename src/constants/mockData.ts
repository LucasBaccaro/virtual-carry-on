import { User, Garment } from '../types';

export const mockUser: User = {
    id: '1',
    name: 'Usuario Demo',
    image: require('../../assets/images/cuerpo1.jpeg'),
};

export const mockGarments: Garment[] = [
    // Remeras
    {
        id: '1',
        name: 'Remera Negra',
        type: 'upper_body',
        description: 'Remera negra básica de algodón',
        fit: 'regular',
        image: require('../../assets/images/remera1.jpg'),
    },
    {
        id: '2',
        name: 'Remera Blanca',
        type: 'upper_body',
        description: 'Remera blanca casual',
        fit: 'regular',
        image: require('../../assets/images/remera2.jpg'),
    },
    // Camisas
    {
        id: '3',
        name: 'Camisa Azul',
        type: 'upper_body',
        description: 'Camisa azul formal',
        fit: 'slim',
        image: require('../../assets/images/camisa1.jpg'),
    },
    {
        id: '4',
        name: 'Camisa Casual',
        type: 'upper_body',
        description: 'Camisa casual de manga larga',
        fit: 'regular',
        image: require('../../assets/images/camisa2.jpg'),
    },
    {
        id: '5',
        name: 'Camisa Negra',
        type: 'upper_body',
        description: 'Camisa negra elegante',
        fit: 'slim',
        image: require('../../assets/images/shirt_black.png'),
    },
    {
        id: '6',
        name: 'Camisa Azul Claro',
        type: 'upper_body',
        description: 'Camisa azul claro de vestir',
        fit: 'regular',
        image: require('../../assets/images/shirt_blue.png'),
    },
    // Pantalones
    {
        id: '7',
        name: 'Jeans Azul',
        type: 'lower_body',
        description: 'Jeans azul clásico',
        fit: 'regular',
        image: require('../../assets/images/jeans.png'),
    },
    {
        id: '8',
        name: 'Pantalón Formal',
        type: 'lower_body',
        description: 'Pantalón de vestir',
        fit: 'slim',
        image: require('../../assets/images/pantalon1.jpg'),
    },
    {
        id: '9',
        name: 'Pantalón Casual',
        type: 'lower_body',
        description: 'Pantalón casual cómodo',
        fit: 'regular',
        image: require('../../assets/images/pantalon2.jpg'),
    },
    {
        id: '10',
        name: 'Pantalón Deportivo',
        type: 'lower_body',
        description: 'Pantalón deportivo',
        fit: 'loose',
        image: require('../../assets/images/pantalon3.jpg'),
    },
    // Shorts
    {
        id: '11',
        name: 'Short Deportivo',
        type: 'lower_body',
        description: 'Short deportivo',
        fit: 'regular',
        image: require('../../assets/images/short1.jpg'),
    },
    {
        id: '12',
        name: 'Short Casual',
        type: 'lower_body',
        description: 'Short casual de verano',
        fit: 'regular',
        image: require('../../assets/images/short2.jpg'),
    },
    // Calzado
    {
        id: '13',
        name: 'Zapatillas Blancas',
        type: 'footwear',
        description: 'Zapatillas deportivas blancas',
        fit: 'regular',
        image: require('../../assets/images/sneakers_white.jpg'),
    },
    {
        id: '14',
        name: 'Zapatos Negros',
        type: 'footwear',
        description: 'Zapatos de vestir negros de cuero',
        fit: 'regular',
        image: require('../../assets/images/shoes_black.jpg'),
    },
    {
        id: '15',
        name: 'Botas Marrones',
        type: 'footwear',
        description: 'Botas de cuero marrón',
        fit: 'regular',
        image: require('../../assets/images/boots_brown.jpg'),
    },
    {
        id: '16',
        name: 'Airmax',
        type: 'footwear',
        description: 'Zapatillas de running',
        fit: 'regular',
        image: require('../../assets/images/zapas.jpg'),
    },
];

export const upperBodyGarments = mockGarments.filter(g => g.type === 'upper_body');
export const lowerBodyGarments = mockGarments.filter(g => g.type === 'lower_body');
export const footwear = mockGarments.filter(g => g.type === 'footwear');
