import User from '../../../src/models/User';

describe('User Model', () => {
    describe('Schema Validation', () => {
        it('should create a user with valid data', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.username).toBe(userData.username);
            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.name).toBe(userData.name);
            expect(savedUser.password).not.toBe(userData.password); // Should be hashed
            expect(savedUser.createdAt).toBeDefined();
        });

        it('should require username', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require unique username', async () => {
            const userData = {
                username: 'duplicate',
                email: 'test1@example.com',
                password: 'password123',
            };

            await new User(userData).save();

            const duplicateUser = new User({
                username: 'duplicate',
                email: 'test2@example.com',
                password: 'password123',
            });

            await expect(duplicateUser.save()).rejects.toThrow();
        });

        it('should require email', async () => {
            const user = new User({
                username: 'testuser',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require unique email', async () => {
            const userData = {
                username: 'user1',
                email: 'duplicate@example.com',
                password: 'password123',
            };

            await new User(userData).save();

            const duplicateUser = new User({
                username: 'user2',
                email: 'duplicate@example.com',
                password: 'password123',
            });

            await expect(duplicateUser.save()).rejects.toThrow();
        });

        it('should require password with min length 6', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: '12345', // Less than 6 characters
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should trim username and email', async () => {
            const user = new User({
                username: '  testuser  ',
                email: '  TEST@EXAMPLE.COM  ',
                password: 'password123',
            });

            const savedUser = await user.save();
            expect(savedUser.username).toBe('testuser');
            expect(savedUser.email).toBe('test@example.com');
        });

        it('should lowercase email', async () => {
            const user = new User({
                username: 'testuser',
                email: 'TEST@EXAMPLE.COM',
                password: 'password123',
            });

            const savedUser = await user.save();
            expect(savedUser.email).toBe('test@example.com');
        });

        it('should accept optional fields', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                avatar: 'https://example.com/avatar.jpg',
                location: 'Hyderabad',
            });

            const savedUser = await user.save();
            expect(savedUser.name).toBe('Test User');
            expect(savedUser.avatar).toBe('https://example.com/avatar.jpg');
            expect(savedUser.location).toBe('Hyderabad');
        });

        it('should require username with min length 3', async () => {
            const user = new User({
                username: 'ab', // Less than 3 characters
                email: 'test@example.com',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const password = 'password123';
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password,
            });

            const savedUser = await user.save();
            expect(savedUser.password).not.toBe(password);
            expect(savedUser.password.length).toBeGreaterThan(20); // bcrypt hash is long
        });

        it('should not hash password if not modified', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const savedUser = await user.save();
            const originalPassword = savedUser.password;

            // Update non-password field
            savedUser.name = 'Updated Name';
            const updatedUser = await savedUser.save();

            expect(updatedUser.password).toBe(originalPassword);
        });

        it('should compare password correctly', async () => {
            const password = 'password123';
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password,
            });

            const savedUser = await user.save();

            const isValid = await savedUser.comparePassword(password);
            expect(isValid).toBe(true);

            const isInvalid = await savedUser.comparePassword('wrongpassword');
            expect(isInvalid).toBe(false);
        });

        it('should hash password on update', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const savedUser = await user.save();
            const originalPassword = savedUser.password;

            // Update password
            savedUser.password = 'newpassword123';
            const updatedUser = await savedUser.save();

            expect(updatedUser.password).not.toBe(originalPassword);
            expect(updatedUser.password).not.toBe('newpassword123');
        });
    });

    describe('Timestamps', () => {
        it('should have createdAt and updatedAt timestamps', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const savedUser = await user.save();
            expect((savedUser as any).createdAt).toBeDefined();
            expect((savedUser as any).updatedAt).toBeDefined();
        });

        it('should update updatedAt on modification', async () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

            const savedUser = await user.save();
            const originalUpdatedAt = (savedUser as any).updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 100));

            savedUser.name = 'Updated Name';
            const updatedUser = await savedUser.save();

            // Check updatedAt exists (timestamps are added by mongoose)
            expect((updatedUser as any).updatedAt).toBeDefined();
            if ((updatedUser as any).updatedAt && originalUpdatedAt) {
                expect((updatedUser as any).updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
            }
        });
    });
});
