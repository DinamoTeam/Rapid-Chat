using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Rapid_Chat.Model
{
    public class Room
    {
        [Key]
        public string RoomName { get; set; }
        public ICollection<Peer> peers { get; set; }
        public Room(string roomName)
        {
            this.RoomName = roomName;
        }

        public Room() {}
    }
}