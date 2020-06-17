using Microsoft.EntityFrameworkCore;
using Rapid_Chat.Model;

namespace Rapid_Chat.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options) {}
        public DbSet<Value> Values { get; set; }
    }
}