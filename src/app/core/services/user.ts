import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { STORAGE_KEYS } from '../constants/storage-keys';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private readonly usersSubject = new BehaviorSubject<User[]>(this.readUsers());
  readonly users$ = this.usersSubject.asObservable();

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readCurrentUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  register(userData: Omit<User, 'id'>): { success: boolean; message: string } {
    const users = this.usersSubject.value;

    const emailAlreadyExists = users.some(
      (user) => user.email.toLowerCase() === userData.email.toLowerCase()
    );

    const cpfAlreadyExists = users.some((user) => user.cpf === userData.cpf);

    if (emailAlreadyExists) {
      return {
        success: false,
        message: 'Já existe um usuário cadastrado com este e-mail.'
      };
    }

    if (cpfAlreadyExists) {
      return {
        success: false,
        message: 'Já existe um usuário cadastrado com este CPF.'
      };
    }

    const newUser: User = {
      id: Date.now(),
      ...userData,
      email: userData.email.toLowerCase()
    };

    const updatedUsers = [...users, newUser];

    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(updatedUsers));
    this.usersSubject.next(updatedUsers);

    return {
      success: true,
      message: 'Cadastro realizado com sucesso.'
    };
  }

  login(email: string, password: string): { success: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();

    const foundUser = this.usersSubject.value.find(
      (user) => user.email === normalizedEmail && user.password === password
    );

    if (!foundUser) {
      return {
        success: false,
        message: 'E-mail ou senha inválidos.'
      };
    }

    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(foundUser));
    this.currentUserSubject.next(foundUser);

    return {
      success: true,
      message: 'Login realizado com sucesso.'
    };
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  private readUsers(): User[] {
    const storedUsers = localStorage.getItem(STORAGE_KEYS.users);

    if (!storedUsers) {
      return [];
    }

    try {
      return JSON.parse(storedUsers) as User[];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.users);
      return [];
    }
  }

  private readCurrentUser(): User | null {
    const storedUser = localStorage.getItem(STORAGE_KEYS.currentUser);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      return null;
    }
  }
};