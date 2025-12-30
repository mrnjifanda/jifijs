import authService from '../../src/services/auth/auth.service';

/**
 * Génère un email unique pour les tests
 */
export function generateUniqueEmail(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `test${timestamp}${random}@example.com`;
}

/**
 * Génère un username unique pour les tests
 */
export function generateUniqueUsername(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `testuser${timestamp}${random}`;
}

/**
 * Crée un utilisateur de test avec authentification
 */
export async function createTestUser(userData: any = {}) {
    const defaultData = {
        email: generateUniqueEmail(),
        password: 'Test@1234',
        first_name: 'Test',
        last_name: 'User',
        username: generateUniqueUsername(),
        role: 'USER'
    };

    const mergedData = { ...defaultData, ...userData };

    // S'assurer que l'email et username sont uniques
    if (!userData.email) {
        mergedData.email = generateUniqueEmail();
    }
    if (!userData.username) {
        mergedData.username = generateUniqueUsername();
    }

    try {
        const result = await authService.register(mergedData);

        if (result.error) {
            throw new Error(`Failed to create test user: ${result.message}`);
        }

        return {
            user: result?.data?.user,
            otp: result?.data?.otp,
            password: mergedData.password
        };
    } catch (error) {
        console.error('Error in createTestUser:', error);
        throw error;
    }
}

/**
 * Active un compte utilisateur
 */
export async function activateTestUser(email: string, otp: string) {
    try {
        const result = await authService.activateAccount({ email, code: otp });
        if (result.error) {
            throw new Error(`Failed to activate user: ${result.message}`);
        }
        return result;
    } catch (error) {
        console.error('Error in activateTestUser:', error);
        throw error;
    }
}

/**
 * Crée un utilisateur activé prêt pour les tests
 */
export async function createActivatedUser(userData: any = {}) {
    try {
        const { user, otp, password } = await createTestUser(userData);
        await activateTestUser(user?.email as string, otp as string);

        // Retourner l'objet user avec le password pour les tests de login
        return {
            _id: user?._id,
            email: user?.email,
            username: user?.username,
            first_name: user?.first_name,
            last_name: user?.last_name,
            password: password
        };
    } catch (error) {
        console.error('Error in createActivatedUser:', error);
        throw error;
    }
}

/**
 * Crée un token de connexion valide
 */
export async function getAuthToken(email: string, password: string): Promise<string> {
    try {
        const loginData = await authService.login(
            { email, password },
            true,
            { ip: '127.0.0.1' }
        );

        if (loginData.error) {
            throw new Error(`Failed to get auth token: ${loginData.message}`);
        }

        return loginData?.data?.token as string;
    } catch (error) {
        console.error('Error in getAuthToken:', error);
        throw error;
    }
}

/**
 * Attend un certain temps (pour les tests async)
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
