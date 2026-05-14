using Repository.Entities;
using Repository.Interfaces;
using Service.Interfaces;
using System.Text.RegularExpressions;
using BCrypt.Net;
namespace Service.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // ================= REGISTER =================
        public async Task<User> Add(User user)
        {
            ValidateUser(user);

            var existing = await _userRepository.GetByEmail(user.Email);
            if (existing != null)
                throw new Exception("Email already exists");

            user.Role = Role.Customer;
            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

            return await _userRepository.Add(user);
        }

        // ================= UPDATE =================
        public async Task<User> Update(int id, User user)
        {
            var existing = await _userRepository.GetById(id);
            if (existing == null)
                throw new Exception("User not found");

            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                ValidateEmail(user.Email);

                var emailOwner = await _userRepository.GetByEmail(user.Email);
                if (emailOwner != null && emailOwner.Id != id)
                    throw new Exception("Email already in use");

                existing.Email = user.Email;
            }

            if (!string.IsNullOrWhiteSpace(user.Password))
            {
                ValidatePassword(user.Password);
                existing.Password = user.Password;
            }

            existing.Name = user.Name ?? existing.Name;
            existing.Phone = user.Phone ?? existing.Phone;

            return await _userRepository.Update(existing);
        }
        public async Task<User> Delete(int id)
        {
            var user = await _userRepository.GetById(id);
            if (user == null)
                throw new Exception("User not found");

            return await _userRepository.Delete(id);
        }

        public async Task<List<User>> GetAll()
            => await _userRepository.GetAll();

        public async Task<User> GetById(int id)
        {
            var user = await _userRepository.GetById(id);
            if (user == null)
                throw new Exception("User not found");

            return user;
        }

        public async Task<User?> GetByEmail(string email)
            => await _userRepository.GetByEmail(email);

        // ================= VALIDATION =================
        private void ValidateUser(User user)
        {
            if (string.IsNullOrWhiteSpace(user.Name))
                throw new Exception("Name required");

            ValidateEmail(user.Email);
            ValidatePassword(user.Password);
        }

        private void ValidateEmail(string email)
        {
            var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
            if (!regex.IsMatch(email))
                throw new Exception("Invalid email format");
        }

        private void ValidatePassword(string password)
        {
            var regex = new Regex(
                @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$");

            if (!regex.IsMatch(password))
                throw new Exception("Weak password");
        }
    }
}