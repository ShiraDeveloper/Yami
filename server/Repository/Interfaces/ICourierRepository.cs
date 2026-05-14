public interface ICourierRepository
{
    Task<List<Courier>> GetAvailableCouriers();
    Task<Courier> GetById(int id);
    Task<IEnumerable<Courier>> GetAll();
}