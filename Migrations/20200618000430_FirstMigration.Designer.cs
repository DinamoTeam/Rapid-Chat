﻿// <auto-generated />
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Rapid_Chat.Data;

namespace RapidChat.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20200618000430_FirstMigration")]
    partial class FirstMigration
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "2.1.14-servicing-32113");

            modelBuilder.Entity("Rapid_Chat.Model.Peer", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd();

                    b.Property<string>("PeerId");

                    b.Property<string>("RoomName");

                    b.HasKey("Id");

                    b.HasIndex("RoomName");

                    b.ToTable("peers");
                });

            modelBuilder.Entity("Rapid_Chat.Model.Room", b =>
                {
                    b.Property<string>("RoomName")
                        .ValueGeneratedOnAdd();

                    b.HasKey("RoomName");

                    b.ToTable("rooms");
                });

            modelBuilder.Entity("Rapid_Chat.Model.Peer", b =>
                {
                    b.HasOne("Rapid_Chat.Model.Room", "Room")
                        .WithMany("peers")
                        .HasForeignKey("RoomName");
                });
#pragma warning restore 612, 618
        }
    }
}
