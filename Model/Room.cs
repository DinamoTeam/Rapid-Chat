using System.ComponentModel.DataAnnotations;

namespace Rapid_Chat.Model
{
    public class Room
    {
        [Key]
        public string RoomName { get; set; }
        public Peer[] peers { get; set; }
        public Room(string roomName)
        {
            this.RoomName = roomName;
        }
    }
}