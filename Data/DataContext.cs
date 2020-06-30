using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using RapidChat.Model;
using Microsoft.IdentityModel.Protocols;
using System.Configuration;

namespace RapidChat.Data
{
    public partial class DataContext : DbContext
    {
        public DataContext()
        {
        }

        public DataContext(DbContextOptions<DataContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Peers> Peers { get; set; }
        public virtual DbSet<Rooms> Rooms { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlite(ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Peers>(entity =>
            {
                entity.HasKey(e => e.PeerId);

                entity.ToTable("peers");

                entity.Property(e => e.PeerId).ValueGeneratedNever();

                entity.Property(e => e.RoomName).IsRequired();

                entity.HasOne(d => d.RoomNameNavigation)
                    .WithMany(p => p.Peers)
                    .HasForeignKey(d => d.RoomName)
                    .OnDelete(DeleteBehavior.ClientSetNull);
            });

            modelBuilder.Entity<Rooms>(entity =>
            {
                entity.HasKey(e => e.RoomName);

                entity.ToTable("rooms");

                entity.Property(e => e.RoomName).ValueGeneratedNever();
            });
        }
    }
}
