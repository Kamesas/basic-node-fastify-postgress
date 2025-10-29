import { User } from "./users.shchemas";

export async function getUsers() {
  return Promise.resolve(["user1", "user2", "user3"]);
}

export async function createUser(userData: User) {
  return Promise.resolve({
    id: Math.random().toString(36).substring(7),
    data: userData,
  });
}
