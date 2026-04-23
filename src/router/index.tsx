import { createHashRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Landing   from '../views/Landing';
import Configure from '../views/Configure';
import Validate  from '../views/Validate';
import Cart      from '../views/Cart';

export const router = createHashRouter([
  {
    path:    '/',
    element: <Layout />,
    children: [
      { index: true,        element: <Landing />   },
      { path: 'configure',  element: <Configure /> },
      { path: 'validate',   element: <Validate />  },
      { path: 'cart',       element: <Cart />      },
    ],
  },
]);
