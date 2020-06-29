using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

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
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. See http://go.microsoft.com/fwlink/?LinkId=723263 for guidance on storing connection strings.
                optionsBuilder.UseSqlite("DataSource=C:\\Projects\\ASPNET\\Rapid-Chat\\rapidchat.sqlite3");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Peers>(entity =>
            {
                entity.ToTable("peers");

                entity.Property(e => e.Id).ValueGeneratedNever();

                entity.Property(e => e.PeerId)
                    .IsRequired()
                    .HasColumnType("VARCHAR(128)");

                entity.Property(e => e.RoomName)
                    .IsRequired()
                    .HasColumnType("VARCHAR(128)");

                entity.HasOne(d => d.RoomNameNavigation)
                    .WithMany(p => p.Peers)
                    .HasForeignKey(d => d.RoomName);
            });

            modelBuilder.Entity<Rooms>(entity =>
            {
                entity.HasKey(e => e.RoomName);

                entity.ToTable("rooms");

                entity.Property(e => e.RoomName)
                    .HasColumnType("VARCHAR(128)")
                    .ValueGeneratedNever();
            });
        }
    }
}
