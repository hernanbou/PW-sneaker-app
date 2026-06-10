import { Routes } from '@angular/router';

import { HomePage } from './pages/home-page/home-page';
import { CartPage } from './pages/cart-page/cart-page';
import { ProductPage } from './pages/product-page/product-page';
import { LoginPage } from './pages/login-page/login-page';
import { RegisterPage } from './pages/register-page/register-page';

export const routes: Routes = [
    { 
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomePage
    },
    {
        path: 'cart',
        component: CartPage
    },
    {
        path: 'product/:id',
        component: ProductPage
    },
    {
        path: 'login',
        component: LoginPage
    },
    {
        path: 'register',
        component: RegisterPage
    },
    {
        path: '**',
        redirectTo: 'home'
    }
];
