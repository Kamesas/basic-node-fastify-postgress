// Mock async function to simulate getting users from database
export async function getUsersFromDb(): Promise<string[]> {
  return Promise.resolve(["user1", "user2", "user3"]);
}

// Mock async function to simulate creating a user in database
export async function createUserInDb(
  userData: any
): Promise<{ id: string; data: any }> {
  return Promise.resolve({
    id: Math.random().toString(36).substring(7),
    data: userData,
  });
}
