using System;
using System.Collections.Generic;

namespace RapidChat
{
    public partial class Rooms
    {
        public Rooms()
        {
            Peers = new HashSet<Peers>();
        }

        public string RoomName { get; set; }

        public ICollection<Peers> Peers { get; set; }
    }
}
